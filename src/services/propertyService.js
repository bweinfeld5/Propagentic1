/**
 * Property Service - PropAgentic
 * 
 * Handles all property-related Firebase operations
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { propertyConverter, createDefaultProperty } from '../models/Property';
import toast from 'react-hot-toast';

const COLLECTION_NAME = 'properties';
const STORAGE_PATH = 'property-photos';

class PropertyService {
  constructor() {
    this.collection = collection(db, COLLECTION_NAME).withConverter(propertyConverter);
  }

  // Create a new property
  async createProperty(propertyData, ownerId) {
    try {
      const newProperty = {
        ...createDefaultProperty(ownerId),
        ...propertyData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(this.collection, newProperty);
      const createdProperty = { ...newProperty, id: docRef.id };
      
      toast.success('Property created successfully!');
      return createdProperty;
    } catch (error) {
      console.error('Error creating property:', error);
      toast.error('Failed to create property');
      throw error;
    }
  }

  // Get property by ID
  async getProperty(propertyId) {
    try {
      const docRef = doc(this.collection, propertyId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        throw new Error('Property not found');
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      toast.error('Failed to load property');
      throw error;
    }
  }

  // Get properties for a specific owner
  async getPropertiesByOwner(ownerId, options = {}) {
    try {
      let q = query(
        this.collection,
        where('ownerId', '==', ownerId),
        orderBy('updatedAt', 'desc')
      );

      // Apply filters
      if (options.status) {
        q = query(q, where('status', '==', options.status));
      }
      
      if (options.type) {
        q = query(q, where('type', '==', options.type));
      }

      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      const querySnapshot = await getDocs(q);
      const properties = [];
      
      querySnapshot.forEach((doc) => {
        properties.push(doc.data());
      });

      return properties;
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
      throw error;
    }
  }

  // Update property
  async updateProperty(propertyId, updates) {
    try {
      const docRef = doc(this.collection, propertyId);
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      await updateDoc(docRef, updateData);
      
      toast.success('Property updated successfully!');
      return { id: propertyId, ...updateData };
    } catch (error) {
      console.error('Error updating property:', error);
      toast.error('Failed to update property');
      throw error;
    }
  }

  // Delete property
  async deleteProperty(propertyId) {
    try {
      // First, get the property to check for photos
      const property = await this.getProperty(propertyId);
      
      // Delete photos from storage
      if (property.photos && property.photos.length > 0) {
        await this.deletePropertyPhotos(property.photos);
      }
      
      // Delete documents from storage
      if (property.documents && property.documents.length > 0) {
        await this.deletePropertyDocuments(property.documents);
      }

      // Delete the property document
      const docRef = doc(this.collection, propertyId);
      await deleteDoc(docRef);
      
      toast.success('Property deleted successfully!');
      return true;
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
      throw error;
    }
  }

  // Upload property photo
  async uploadPropertyPhoto(propertyId, file, metadata = {}) {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB');
      }

      // Create unique filename
      const timestamp = Date.now();
      const fileName = `${propertyId}_${timestamp}_${file.name}`;
      const storageRef = ref(storage, `${STORAGE_PATH}/${fileName}`);

      // Upload file
      const uploadResult = await uploadBytes(storageRef, file, {
        customMetadata: {
          propertyId,
          uploadedAt: new Date().toISOString(),
          ...metadata
        }
      });

      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      toast.success('Photo uploaded successfully!');
      return {
        url: downloadURL,
        fileName,
        size: file.size,
        type: file.type,
        uploadedAt: new Date()
      };
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error(`Failed to upload photo: ${error.message}`);
      throw error;
    }
  }

  // Upload multiple photos
  async uploadPropertyPhotos(propertyId, files) {
    try {
      const uploadPromises = files.map(file => 
        this.uploadPropertyPhoto(propertyId, file)
      );
      
      const results = await Promise.allSettled(uploadPromises);
      const successful = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
      
      const failed = results
        .filter(result => result.status === 'rejected')
        .length;

      if (failed > 0) {
        toast.warning(`${successful.length} photos uploaded, ${failed} failed`);
      } else {
        toast.success(`All ${successful.length} photos uploaded successfully!`);
      }

      return successful;
    } catch (error) {
      console.error('Error uploading multiple photos:', error);
      toast.error('Failed to upload photos');
      throw error;
    }
  }

  // Add photos to property
  async addPhotosToProperty(propertyId, photoUrls) {
    try {
      const property = await this.getProperty(propertyId);
      const updatedPhotos = [...(property.photos || []), ...photoUrls];
      
      await this.updateProperty(propertyId, { photos: updatedPhotos });
      return updatedPhotos;
    } catch (error) {
      console.error('Error adding photos to property:', error);
      throw error;
    }
  }

  // Remove photo from property
  async removePhotoFromProperty(propertyId, photoUrl) {
    try {
      const property = await this.getProperty(propertyId);
      const updatedPhotos = (property.photos || []).filter(url => url !== photoUrl);
      
      // Delete from storage
      await this.deletePhotoFromStorage(photoUrl);
      
      // Update property
      await this.updateProperty(propertyId, { photos: updatedPhotos });
      
      toast.success('Photo removed successfully!');
      return updatedPhotos;
    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error('Failed to remove photo');
      throw error;
    }
  }

  // Delete photo from storage
  async deletePhotoFromStorage(photoUrl) {
    try {
      const photoRef = ref(storage, photoUrl);
      await deleteObject(photoRef);
    } catch (error) {
      console.error('Error deleting photo from storage:', error);
      // Don't throw here - photo might already be deleted
    }
  }

  // Delete multiple photos from storage
  async deletePropertyPhotos(photoUrls) {
    try {
      const deletePromises = photoUrls.map(url => this.deletePhotoFromStorage(url));
      await Promise.allSettled(deletePromises);
    } catch (error) {
      console.error('Error deleting property photos:', error);
    }
  }

  // Delete documents from storage (similar to photos)
  async deletePropertyDocuments(documentUrls) {
    try {
      const deletePromises = documentUrls.map(url => {
        const docRef = ref(storage, url);
        return deleteObject(docRef);
      });
      await Promise.allSettled(deletePromises);
    } catch (error) {
      console.error('Error deleting property documents:', error);
    }
  }

  // Search properties
  async searchProperties(ownerId, searchTerm) {
    try {
      const properties = await this.getPropertiesByOwner(ownerId);
      
      if (!searchTerm) return properties;
      
      const term = searchTerm.toLowerCase();
      return properties.filter(property => 
        property.name.toLowerCase().includes(term) ||
        property.description.toLowerCase().includes(term) ||
        property.address.street.toLowerCase().includes(term) ||
        property.address.city.toLowerCase().includes(term) ||
        property.address.state.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error searching properties:', error);
      throw error;
    }
  }

  // Get property statistics
  async getPropertyStats(ownerId) {
    try {
      const properties = await this.getPropertiesByOwner(ownerId);
      
      const stats = {
        total: properties.length,
        occupied: properties.filter(p => p.status === 'occupied').length,
        vacant: properties.filter(p => p.status === 'vacant').length,
        maintenance: properties.filter(p => p.status === 'maintenance').length,
        totalRent: properties.reduce((sum, p) => sum + (p.monthlyRent || 0), 0),
        totalValue: properties.reduce((sum, p) => sum + (p.propertyValue || 0), 0)
      };

      stats.occupancyRate = stats.total > 0 ? (stats.occupied / stats.total) * 100 : 0;

      return stats;
    } catch (error) {
      console.error('Error getting property stats:', error);
      throw error;
    }
  }

  // Batch operations
  async batchUpdateProperties(updates) {
    try {
      const batch = writeBatch(db);
      
      updates.forEach(({ propertyId, data }) => {
        const docRef = doc(this.collection, propertyId);
        batch.update(docRef, { ...data, updatedAt: new Date() });
      });

      await batch.commit();
      toast.success('Properties updated successfully!');
      return true;
    } catch (error) {
      console.error('Error batch updating properties:', error);
      toast.error('Failed to update properties');
      throw error;
    }
  }
}

export default new PropertyService(); 