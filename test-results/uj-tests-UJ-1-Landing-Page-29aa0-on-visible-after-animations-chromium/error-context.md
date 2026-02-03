# Page snapshot

```yaml
- dialog "Unhandled Runtime Error" [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - navigation [ref=e7]:
          - button "previous" [disabled] [ref=e8]:
            - img "previous" [ref=e9]
          - button "next" [disabled] [ref=e11]:
            - img "next" [ref=e12]
          - generic [ref=e14]: 1 of 1 error
        - button "Close" [ref=e15] [cursor=pointer]:
          - img [ref=e17]
      - heading "Unhandled Runtime Error" [level=1] [ref=e20]
      - paragraph [ref=e21]: "Error: Could not find the module \"/root/.openclaw/workspace/startup/src/components/landing/Navbar.tsx#Navbar\" in the React Client Manifest. This is probably a bug in the React Server Components bundler."
    - generic [ref=e22]:
      - heading "Call Stack" [level=2] [ref=e23]
      - group [ref=e24]:
        - generic "Next.js" [ref=e25] [cursor=pointer]:
          - img [ref=e26]
          - img [ref=e28]
          - text: Next.js
```