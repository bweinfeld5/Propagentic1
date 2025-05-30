# Phase 1.1 Testing Checklist - PropAgentic

## 🧪 **Testing Overview**
Comprehensive test plan for Phase 1.1 Authentication & Onboarding Polish features.

**Application URL**: `http://localhost:3005` (or any active port from your serves)

---

## **🔐 1. Authentication & Error Handling Tests**

### **A. Safe Router & Error Recovery**
- [ ] **Test 1**: Navigate to `/login` - should load properly
- [ ] **Test 2**: Navigate to `/signup` - should load properly  
- [ ] **Test 3**: Try to access protected route `/dashboard` without auth - should redirect gracefully
- [ ] **Test 4**: Check browser console for any authentication errors - should be clean
- [ ] **Test 5**: Test with invalid localStorage data:
  ```javascript
  localStorage.setItem('userProfile', 'invalid-json');
  location.reload();
  ```
  - Should recover gracefully with error page

### **B. Enhanced Auth Context**
- [ ] **Test 6**: Check if auth utilities are working by opening browser console:
  ```javascript
  // This should not throw errors
  console.log('Auth context loaded successfully');
  ```

---

## **💾 2. Auto-Save Onboarding System Tests**

### **A. Landlord Onboarding with Auto-Save**
- [ ] **Test 7**: Navigate to `/landlord/onboarding`
- [ ] **Test 8**: Fill out personal information (step 1):
  - First Name: "John"
  - Last Name: "Smith"  
  - Phone: "(555) 123-4567"
- [ ] **Test 9**: Check for auto-save indicator - should show "Saved" status
- [ ] **Test 10**: Refresh the page - should show progress recovery banner
- [ ] **Test 11**: Click "Restore Progress" - form should be pre-filled
- [ ] **Test 12**: Complete all 4 onboarding steps:
  1. Personal Information
  2. Property Portfolio  
  3. Business Information
  4. Preferences
- [ ] **Test 13**: Verify step navigation works without losing data

### **B. Cross-Device Progress Sync**
- [ ] **Test 14**: Open different browser/incognito mode
- [ ] **Test 15**: Login with same account - should offer to restore progress

---

## **🏢 3. Bulk Property Import Tests**

### **A. Access Bulk Import**
- [ ] **Test 16**: Navigate to landlord dashboard
- [ ] **Test 17**: Look for "Bulk Import" or "Import Properties" button
- [ ] **Test 18**: Click to open bulk import modal

### **B. Template Download & File Upload**
- [ ] **Test 19**: Click "Download Template" - should download CSV file
- [ ] **Test 20**: Open downloaded template - should have correct headers:
  - address, city, state, zipCode, propertyName, units, propertyType, notes
- [ ] **Test 21**: Create test CSV with sample data:
  ```csv
  address,city,state,zipCode,propertyName,units,propertyType,notes
  123 Main St,New York,NY,10001,Main Street Apts,12,Apartment,Recently renovated
  456 Oak Ave,Brooklyn,NY,11201,Oak Gardens,8,Townhouse,Pet-friendly
  ```
- [ ] **Test 22**: Upload the CSV file - should show preview
- [ ] **Test 23**: Verify validation results show "valid" status
- [ ] **Test 24**: Click "Import Properties" - should process successfully

### **C. Error Handling**
- [ ] **Test 25**: Upload CSV with missing required fields - should show errors
- [ ] **Test 26**: Upload invalid file type (.txt) - should reject with message
- [ ] **Test 27**: Upload CSV with invalid ZIP codes - should flag warnings

---

## **📧 4. Enhanced Onboarding Integration Tests**

### **A. Role-Specific Onboarding**
- [ ] **Test 28**: Complete landlord onboarding - should redirect to landlord dashboard
- [ ] **Test 29**: Test contractor signup flow (if available)
- [ ] **Test 30**: Test tenant signup flow (if available)

### **B. Progress Tracking**
- [ ] **Test 31**: Check progress bar updates correctly through steps
- [ ] **Test 32**: Verify step validation prevents advancement with incomplete data
- [ ] **Test 33**: Test backwards navigation maintains data

---

## **🎨 5. UI/UX Verification Tests**

### **A. Marketing Site**
- [ ] **Test 34**: Homepage loads correctly at root URL
- [ ] **Test 35**: Role selector (Landlord/Tenant/Contractor) works
- [ ] **Test 36**: Email signup form validates properly
- [ ] **Test 37**: Navigation between marketing pages works
- [ ] **Test 38**: Responsive design works on mobile (resize browser)

### **B. Component Styling**
- [ ] **Test 39**: Login/Signup buttons in header have consistent styling
- [ ] **Test 40**: Form inputs have proper focus states
- [ ] **Test 41**: Loading states show appropriate feedback
- [ ] **Test 42**: Error messages are clearly visible

---

## **⚡ 6. Performance & Build Tests**

### **A. Build Quality**
- [ ] **Test 43**: Check browser console for build errors - should be clean
- [ ] **Test 44**: Verify no 404 errors for assets in Network tab
- [ ] **Test 45**: Check bundle size is reasonable (< 500KB main bundle)
- [ ] **Test 46**: Test page load speed (< 3 seconds)

### **B. Browser Compatibility**
- [ ] **Test 47**: Test in Chrome - should work fully
- [ ] **Test 48**: Test in Firefox - should work fully  
- [ ] **Test 49**: Test in Safari - should work fully
- [ ] **Test 50**: Test on mobile browser - should be responsive

---

## **🔧 7. Development Environment Tests**

### **A. Serve Configuration**
- [ ] **Test 51**: Verify app serves correctly on multiple ports
- [ ] **Test 52**: Check hot-reload works in development
- [ ] **Test 53**: Verify environment variables are properly loaded

### **B. Dependencies**
- [ ] **Test 54**: Verify all new dependencies are installed:
  ```bash
  npm list papaparse xlsx date-fns lodash
  ```
- [ ] **Test 55**: Check for any peer dependency warnings

---

## **📋 Test Results Summary**

**Date**: _______________  
**Tester**: _____________  
**Build Version**: ______

### **✅ Passed Tests**: ___/55
### **❌ Failed Tests**: ___/55  
### **⚠️ Issues Found**: 

1. _________________________________
2. _________________________________
3. _________________________________

### **🏆 Overall Assessment**:
- [ ] **Ready for Production** (50+ tests passing)
- [ ] **Needs Minor Fixes** (45-49 tests passing) 
- [ ] **Needs Major Work** (< 45 tests passing)

---

## **🚀 Next Steps After Testing**

1. **If all tests pass**: Deploy to staging environment
2. **If minor issues**: Fix specific problems and re-test
3. **If major issues**: Review implementation and debug

**Testing Completed**: ___/___/2025 