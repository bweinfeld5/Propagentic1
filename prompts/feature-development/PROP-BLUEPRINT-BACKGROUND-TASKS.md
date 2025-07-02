# PropAgentic Animated Blueprint Background Tasks

## Implementation Status

- [x] Create SVG assets
  - [x] `/src/assets/blueprint-grid.svg` with subtle grid lines in #094067 @ 5-8% opacity
  - [x] `/src/assets/blueprint-details.svg` with property icons in #3DA9FC & #EF4565 @ 3-5% opacity

- [x] Build React component 
  - [x] Created `/src/components/branding/AnimatedBlueprintBackground.jsx`
  - [x] Implemented scroll-based parallax and opacity logic
  - [x] Added dynamic density & section props for customization

- [x] Style overlays
  - [x] Created `/src/components/branding/AnimatedBlueprintBackground.module.css`
  - [x] Added mix-blend-mode and opacity control
  - [x] Implemented responsive adjustments
  - [x] Added fade-in animation effects

- [x] Integrate in sections
  - [x] Added to HeroSection with sparse density
  - [x] Added to FeaturesSection with dense setting
  - [x] Added semi-transparent backgrounds to feature cards

- [x] Add Lottie animation
  - [x] Created `/src/assets/lottie/welding-spark.json` animation
  - [x] Installed lottie-react package
  - [x] Added to bottom of HeroSection

- [x] Final testing and polish
  - [x] Fixed build issues (JSON parsing error)
  - [x] Successfully compiled and tested in production build
  - [x] Verified animations and scrolling effects 
  - [x] Confirmed visual elements work correctly across sections

## Design Reference

- **Gridlines:** #094067 @ 5–8% opacity  
- **Details:** #3DA9FC/#EF4565 @ 3–5% opacity  
- **Parallax:** 1–3px drift, 1° rotation  
- **Blend:** `mix-blend-mode: overlay` & `color-dodge`  
- **Lottie:** Welding spark animation at bottom of Hero

## Brand Storytelling

This background visually reinforces PropAgentic's role as the "infrastructure" connecting people and property, in a technical yet warm way:

- **Blueprint elements** represent the systematic, organized approach to property management
- **Apartment outlines** visually reinforce the real estate focus
- **Pipes and wiring** showcase the maintenance and operations aspect
- **Wrench icons** highlight the contractor/service aspects
- **Subtle animation** brings energy and modernity to the design

## Implementation Guide

To add the animated blueprint background to other sections of the application:

1. **Import the component:**
   ```jsx
   import AnimatedBlueprintBackground from '../../components/branding/AnimatedBlueprintBackground';
   ```

2. **Add it to your section component:**
   ```jsx
   <section className="your-section-class relative overflow-hidden">
     {/* Add blueprint background with appropriate density/section */}
     <AnimatedBlueprintBackground density="normal" section="yourSection" />
     
     {/* Your section content */}
     <div className="relative z-10"> 
       {/* Content goes here */}
     </div>
   </section>
   ```

3. **Configure parameters:**
   - `density`: Controls how prominent the elements are ("sparse", "normal", "dense")
   - `section`: Identifies where it's used for custom animations ("hero", "features", etc.)

4. **Important CSS considerations:**
   - Add `relative overflow-hidden` to the parent container
   - Add `relative z-10` to content elements to ensure they appear above the background
   - Use semi-transparent backgrounds (e.g., `bg-white/90 backdrop-blur-sm`) for cards/elements

5. **Optional Lottie integration:**
   ```jsx
   import Lottie from 'lottie-react';
   import weldingSpark from '../../../assets/lottie/welding-spark.json';
   
   // Then in your component:
   <div className="absolute bottom-4 right-4 z-10">
     <Lottie 
       animationData={weldingSpark} 
       loop={false} 
       style={{ width: 80, height: 80 }}
       aria-hidden="true" 
     />
   </div>
   ```

## Future Improvements

- Consider adding more property-specific icons to blueprint details (HVAC systems, electrical layouts)
- Investigate WebGL-based particle animations for even more engaging blueprint elements
- Allow blueprint elements to "react" to user interaction (cursor proximity effects)
- Optimize SVG assets further for performance
- Consider a light mode variation with adjusted color palette

## Technical Notes

- Used SVG patterns with `patternUnits="userSpaceOnUse"` for seamless tiling
- Implemented dynamic opacity based on scroll position
- Used CSS composition for shared styles
- Added aria-hidden attributes for accessibility
- Used React useRef and useEffect for performant animation
- Fixed build issues related to empty JSON animation file 