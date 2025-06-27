# PropAgentic App.jsx Architecture Diagrams

## 📋 Diagram Collection

This folder contains comprehensive UML sequence diagrams and flowcharts that visualize the complete PropAgentic App.jsx architecture.

### 🎯 Available Diagrams

| Diagram | File | Purpose |
|---------|------|---------|
| **Main App Flow** | `app-main-flow.mmd` | Complete application initialization sequence from user navigation to final rendering |
| **Authentication & Routing** | `auth-routing-flow.mmd` | Deep dive into PrivateRoute, AuthProvider, and role-based redirect logic |
| **Provider Hierarchy** | `provider-hierarchy.mmd` | Shows how React Context providers are initialized and data flows between them |
| **Component Loading Strategy** | `component-loading-strategy.mmd` | Flowchart showing bundle-time vs lazy loading decisions |

---

## 🚀 Quick Start

### **Easiest Way - Online Viewing**
1. **Copy any diagram content**: `cat app-main-flow.mmd`
2. **Go to**: https://mermaid.live/
3. **Paste and view instantly**

### **VS Code (Recommended for Editing)**
```bash
# Install Mermaid extension
code --install-extension bierner.markdown-mermaid

# Open any diagram
code app-main-flow.mmd

# Right-click → "Open Preview"
```

### **Generate Images**
```bash
# Install CLI globally
npm install -g @mermaid-js/mermaid-cli

# Convert to PNG
mmdc -i app-main-flow.mmd -o app-main-flow.png
```

---

## 📖 Understanding the Diagrams

### **1. Main App Flow (`app-main-flow.mmd`)**
- **Start here** for overall architecture understanding
- Shows complete user journey from page load to dashboard
- Covers both first-time and returning visitor flows
- Demonstrates public vs private route handling

### **2. Authentication & Routing (`auth-routing-flow.mmd`)**
- **Focus**: Security and user flow
- Deep dive into PrivateRoute component logic
- Role-based redirection (tenant/landlord/contractor)
- Onboarding flow decision trees

### **3. Provider Hierarchy (`provider-hierarchy.mmd`)**
- **Focus**: React Context architecture
- Shows initialization order of providers
- Context dependencies and data flow
- How different parts of the app access shared state

### **4. Component Loading Strategy (`component-loading-strategy.mmd`)**
- **Focus**: Performance and loading strategies
- Bundle-time vs lazy loading decisions
- Which components load when
- Loading spinner and user experience flow

---

## 🔄 When to Update These Diagrams

- **App.jsx changes** → Update main-flow diagram
- **New routes added** → Update auth-routing diagram  
- **New providers added** → Update provider-hierarchy diagram
- **Loading strategy changes** → Update component-loading diagram

---

## 📚 Additional Resources

- **Full Documentation**: `../HOW_TO_VIEW_DIAGRAMS.md`
- **App Analysis**: `../APP_LOGIC_FLOW_ANALYSIS.md`
- **UML Documentation**: `../APP_UML_DIAGRAMS.md`

---

## 💡 Pro Tips

1. **Start with main-flow** to get the big picture
2. **Use auth-routing** to understand security flows
3. **Reference provider-hierarchy** when debugging context issues
4. **Check component-loading** for performance optimization

These diagrams are your roadmap to understanding PropAgentic's architecture! 🗺️ 