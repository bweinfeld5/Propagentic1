import React, { useState } from 'react';
import './SearchPropertyCard.css';

const SearchPropertyCard = ({ 
  property, 
  viewMode = 'grid',
  onView,
  onFavorite,
  isFavorited = false 
}) => {
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Format price with currency
  const formatPrice = (price) => {
    if (!price) return 'Price not available';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      available: 'success',
      occupied: 'warning',
      maintenance: 'error',
      pending: 'info'
    };
    return colors[status] || 'default';
  };

  // Get property type icon
  const getPropertyTypeIcon = (type) => {
    const icons = {
      apartment: '🏢',
      house: '🏠',
      condo: '🏘️',
      townhouse: '🏘️',
      studio: '🏠',
      loft: '🏢'
    };
    return icons[type] || '🏠';
  };

  // Parse HTML content for description
  const parseHTMLContent = (htmlContent) => {
    if (!htmlContent) return '';
    // Remove HTML tags for preview
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  // Truncate text
  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    const cleanText = parseHTMLContent(text);
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength) + '...';
  };

  // Get amenities preview
  const getAmenitiesPreview = (amenities, maxShow = 3) => {
    if (!amenities || amenities.length === 0) return [];
    return amenities.slice(0, maxShow);
  };

  // Handle image navigation
  const nextImage = (e) => {
    e.stopPropagation();
    if (property.photos && property.photos.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === property.photos.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (property.photos && property.photos.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? property.photos.length - 1 : prev - 1
      );
    }
  };

  const handleCardClick = () => {
    if (onView) {
      onView(property);
    }
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (onFavorite) {
      onFavorite(property.id);
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="search-property-card list-view" onClick={handleCardClick}>
        <div className="property-image-container">
          {property.photos && property.photos.length > 0 && !imageError ? (
            <>
              <img
                src={property.photos[currentImageIndex]}
                alt={property.name}
                onError={() => setImageError(true)}
                className="property-image"
              />
              {property.photos.length > 1 && (
                <>
                  <button 
                    className="image-nav prev"
                    onClick={prevImage}
                    aria-label="Previous image"
                  >
                    ←
                  </button>
                  <button 
                    className="image-nav next"
                    onClick={nextImage}
                    aria-label="Next image"
                  >
                    →
                  </button>
                  <div className="image-counter">
                    {currentImageIndex + 1} / {property.photos.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="property-image-placeholder">
              <span>No Image</span>
            </div>
          )}
          
          <button 
            className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
            onClick={handleFavoriteClick}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorited ? '❤️' : '🤍'}
          </button>
        </div>

        <div className="property-info">
          <div className="property-header">
            <div className="property-title-section">
              <h3 className="property-title">
                {getPropertyTypeIcon(property.type)} {property.name}
              </h3>
              <span className={`status-badge ${getStatusColor(property.status)}`}>
                {property.status}
              </span>
            </div>
            <div className="property-price">
              {formatPrice(property.rent)}/month
            </div>
          </div>

          <div className="property-location">
            📍 {property.address}
            {property.city && `, ${property.city}`}
            {property.state && `, ${property.state}`}
          </div>

          <div className="property-specs">
            {property.bedrooms !== undefined && (
              <span className="spec">🛏️ {property.bedrooms} bed</span>
            )}
            {property.bathrooms !== undefined && (
              <span className="spec">🚿 {property.bathrooms} bath</span>
            )}
            {property.squareFeet && (
              <span className="spec">📐 {property.squareFeet.toLocaleString()} sqft</span>
            )}
          </div>

          <div className="property-description">
            {truncateText(property.description, 200)}
          </div>

          {property.amenities && property.amenities.length > 0 && (
            <div className="property-amenities">
              <strong>Amenities: </strong>
              {getAmenitiesPreview(property.amenities).map((amenity, index) => (
                <span key={index} className="amenity-tag">
                  {amenity}
                </span>
              ))}
              {property.amenities.length > 3 && (
                <span className="amenity-tag more">
                  +{property.amenities.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="property-footer">
            <div className="availability">
              <strong>Available:</strong> {formatDate(property.availableDate)}
            </div>
            {property.rating && (
              <div className="property-rating">
                ⭐ {property.rating.toFixed(1)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div className="search-property-card grid-view" onClick={handleCardClick}>
      <div className="property-image-container">
        {property.photos && property.photos.length > 0 && !imageError ? (
          <>
            <img
              src={property.photos[currentImageIndex]}
              alt={property.name}
              onError={() => setImageError(true)}
              className="property-image"
            />
            {property.photos.length > 1 && (
              <>
                <button 
                  className="image-nav prev"
                  onClick={prevImage}
                  aria-label="Previous image"
                >
                  ←
                </button>
                <button 
                  className="image-nav next"
                  onClick={nextImage}
                  aria-label="Next image"
                >
                  →
                </button>
                <div className="image-counter">
                  {currentImageIndex + 1} / {property.photos.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="property-image-placeholder">
            <span>No Image</span>
          </div>
        )}
        
        <button 
          className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorited ? '❤️' : '🤍'}
        </button>

        <span className={`status-badge ${getStatusColor(property.status)}`}>
          {property.status}
        </span>
      </div>

      <div className="property-info">
        <div className="property-header">
          <h3 className="property-title">
            {getPropertyTypeIcon(property.type)} {property.name}
          </h3>
          <div className="property-price">
            {formatPrice(property.rent)}/month
          </div>
        </div>

        <div className="property-location">
          📍 {property.address}
          {property.city && `, ${property.city}`}
        </div>

        <div className="property-specs">
          {property.bedrooms !== undefined && (
            <span className="spec">🛏️ {property.bedrooms}</span>
          )}
          {property.bathrooms !== undefined && (
            <span className="spec">🚿 {property.bathrooms}</span>
          )}
          {property.squareFeet && (
            <span className="spec">📐 {property.squareFeet.toLocaleString()}</span>
          )}
        </div>

        <div className="property-description">
          {truncateText(property.description, 120)}
        </div>

        {property.amenities && property.amenities.length > 0 && (
          <div className="property-amenities">
            {getAmenitiesPreview(property.amenities, 2).map((amenity, index) => (
              <span key={index} className="amenity-tag">
                {amenity}
              </span>
            ))}
            {property.amenities.length > 2 && (
              <span className="amenity-tag more">
                +{property.amenities.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="property-footer">
          <div className="availability">
            Available: {formatDate(property.availableDate)}
          </div>
          {property.rating && (
            <div className="property-rating">
              ⭐ {property.rating.toFixed(1)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPropertyCard; 