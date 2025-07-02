# PropAgentic Pitch Deck Demo

## Overview
This interactive demo showcases the complete PropAgentic workflow for your pitch deck presentations. It includes a self-running presentation that demonstrates key features for both landlords and tenants.

## Access the Demo

### Live URL
```
http://localhost:3000/demo/pitchdeck
```

### Standalone HTML
For embedding in presentations or offline use:
```
/public/pitch-demo-standalone.html
```

## Demo Features

### 1. **Auto-Play Presentation**
- 9 comprehensive slides showing the complete user journey
- Auto-advances every 5 seconds
- Pause/Play controls for manual navigation
- Visual indicators for landlord vs. tenant views

### 2. **Key Workflows Demonstrated**

#### **Onboarding Flow**
- Google OAuth signup (instant account creation)
- Role selection (Landlord/Tenant)
- Zero-friction onboarding

#### **Landlord Features**
- Dashboard with AI insights
- Property analytics
- Smart invite system
- Predictive maintenance alerts
- Cost-saving recommendations

#### **Tenant Features**
- Intuitive dashboard
- AI-powered maintenance requests
- Real-time status updates
- Mobile-first design

#### **AI Capabilities**
- Automatic issue categorization
- Predictive maintenance
- Smart contractor matching
- Cost optimization insights

### 3. **Visual Elements**
- Clean, modern interface
- Brand colors (Orange/Amber gradients)
- Smooth animations
- Responsive design
- Dark theme for presentations

## Using in Your Pitch Deck

### Option 1: Live Demo
1. Open the demo URL in a browser
2. Press F11 for fullscreen
3. Let it auto-play or control manually
4. Use arrow keys to navigate between slides

### Option 2: Screen Recording
1. Record the auto-playing demo
2. Export as video (MP4/MOV)
3. Embed in PowerPoint/Keynote/Google Slides

### Option 3: Screenshots
Each slide is designed for high-quality screenshots:
- Step 1: Welcome & Overview
- Step 2: Google Sign-up
- Step 3: Landlord Dashboard
- Step 4: Invite System
- Step 5: Tenant Dashboard
- Step 6: AI Maintenance
- Step 7: Status Tracking
- Step 8: Analytics
- Step 9: Value Proposition

### Option 4: Embedding
Use the standalone HTML file for offline presentations:
1. Save `/public/pitch-demo-standalone.html`
2. Open directly in browser
3. Click to launch full demo

## Customization

### Timing
To adjust auto-play timing, modify in `PitchDeckDemo.tsx`:
```javascript
}, 5000); // Change from 5000ms to desired milliseconds
```

### Content
Each slide's content is in the `demoSteps` array. Modify text, statistics, or visuals as needed.

### Branding
- Primary colors: Orange (#f97316) to Amber (#fbbf24)
- Secondary: Teal/Cyan for tenant features
- Adjust in the component's style definitions

## Key Statistics Shown
- **85% Time Saved** - Through automation
- **40% Cost Reduction** - Via predictive maintenance
- **24/7 AI Support** - Always available
- **89% Response Rate** - Tenant satisfaction
- **4.8 Average Rating** - Platform excellence
- **18h Avg Resolution** - Quick issue resolution

## Technical Details
- Built with React/TypeScript
- Tailwind CSS for styling
- Lucide icons
- Responsive design
- No external dependencies for demo

## Support
For questions or customization needs, contact the development team.

---

**Pro Tip**: The demo looks best on a 16:9 display in fullscreen mode. Perfect for projectors and presentation screens! 