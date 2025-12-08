# Step-by-Step Guide: Implementing the New Miniapp Design

## Prerequisites

- Miniapp Name: ****\_\_\_****
- Creator Name: ****\_\_\_****

---

## Step 1: Adding Floral Border

### 1.1 Modify body styles in `index.css`

In the file `Diary/src/index.css`, find the `body` section (lines 8-15) and change it as follows:

**Before:**

```css
body {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu",
    "Cantarell", sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: #333;
}
```

**After:**

```css
body {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu",
    "Cantarell", sans-serif;
  background:
    url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ff9ec5' fill-opacity='0.4'%3E%3Cpath d='M40 40c-8 0-16-4-16-12s8-12 16-12 16 4 16 12-8 12-16 12zm0-24c-4 0-8 2-8 6s4 6 8 6 8-2 8-6-4-6-8-6z'/%3E%3Cpath d='M20 20c-4 0-8-2-8-6s4-6 8-6 8 2 8 6-4 6-8 6zm40 40c-4 0-8-2-8-6s4-6 8-6 8 2 8 6-4 6-8 6z'/%3E%3C/g%3E%3C/svg%3E"),
    linear-gradient(135deg, #fef5e7 0%, #ffe8e8 50%, #e8f4f8 100%);
  background-size:
    80px 80px,
    100% 100%;
  background-attachment: fixed;
  min-height: 100vh;
  color: #333;
  padding: 10px;
}
```

### 1.2 Modify app-container styles

Change the `.app-container` section (lines 17-24) as follows:

**Before:**

```css
.app-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
```

**After:**

```css
.app-container {
  max-width: 600px;
  margin: 20px auto;
  padding: 30px;
  min-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  position: relative;
  border: 10px solid transparent;
  background-clip: padding-box;
}

.app-container::before {
  content: "";
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background: repeating-linear-gradient(
    45deg,
    #ff9ec5 0px,
    #ff9ec5 15px,
    #ffd6e8 15px,
    #ffd6e8 30px,
    #ffe8e8 30px,
    #ffe8e8 45px,
    #fff0f5 45px,
    #fff0f5 60px
  );
  border-radius: 25px;
  z-index: -1;
}
```

---

## Step 2: Creating Header with App Name and Creator

### 2.1 Add header styles in `index.css`

Add this at the end of the `index.css` file:

```css
/* App Header */
.app-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
}

.app-name {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.25rem;
}

.app-creator {
  font-size: 1rem;
  color: #666;
  font-style: italic;
}
```

### 2.2 Modify JSX in `App.tsx`

In the file `Diary/src/App.tsx`, find the header section and replace it with this code:

**In the render function, before main-content:**

```tsx
<div className="app-header">
  <h1 className="app-name">Your Miniapp Name</h1>
  <p className="app-creator">by Creator Name</p>
</div>
```

---

## Step 3: Creating Profile Card

### 3.1 Add profile card styles

Add this to `index.css`:

```css
/* Profile Card */
.profile-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  cursor: pointer;
  transition: opacity 0.2s;
}

.profile-info:hover {
  opacity: 0.8;
}

.profile-picture {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #ff9ec5;
  cursor: pointer;
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.profile-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  cursor: pointer;
}

.profile-memories {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.memories-label {
  font-size: 0.85rem;
  color: #666;
}

.memories-count {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ff9ec5;
}
```

### 3.2 Add profile card in `App.tsx`

Add this section before the form:

```tsx
{
  /* Profile Card */
}
{
  isConnected && (
    <div className="profile-card">
      <div className="profile-info" onClick={handleProfileClick}>
        <img
          src={profileImage || "/DiaryLogo.jpg"}
          alt="Profile"
          className="profile-picture"
        />
        <div className="profile-details">
          <div className="profile-name">
            {userName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
          </div>
        </div>
      </div>
      <div className="profile-memories">
        <div className="memories-label">Memories</div>
        <div className="memories-count">{memoryCount}</div>
        <div className="memories-label">number of minted</div>
      </div>
    </div>
  );
}
```

---

## Step 4: Adding Function to Get Number of Memories

### 4.1 Add state and hook in `App.tsx`

At the top of the `App` component, after existing states:

```tsx
const [memoryCount, setMemoryCount] = useState<number>(0);
const [userName, setUserName] = useState<string>("");
const [profileImage, setProfileImage] = useState<string>("");
```

### 4.2 Add import for readContract

At the top of the file:

```tsx
import { useReadContract } from "wagmi";
```

### 4.3 Add hook to read balance

After existing hooks:

```tsx
// Get user's NFT balance (number of memories)
const { data: balance } = useReadContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: "balanceOf",
  args: address ? [address] : undefined,
  query: {
    enabled: !!address && isConnected,
  },
});
```

### 4.4 Add useEffect to update memoryCount

```tsx
useEffect(() => {
  if (balance !== undefined) {
    setMemoryCount(Number(balance) || 0);
  }
}, [balance]);
```

### 4.5 Update ABI

Update the ABI to include balanceOf:

```tsx
const CONTRACT_ABI = parseAbi([
  "function mintDiary(string memory ipfsHash) public returns (uint256)",
  "event DiaryMinted(uint256 indexed tokenId, address indexed recipient, string ipfsHash)",
  "function tokenIds(uint256 tokenId) public view returns (uint256)",
  "function balanceOf(address owner) public view returns (uint256)", // Add this
]);
```

---

## Step 5: Adding Profile Click Function

### 5.1 Add state to show memories page

```tsx
const [showMemoriesPage, setShowMemoriesPage] = useState(false);
```

### 5.2 Add handler

```tsx
const handleProfileClick = () => {
  if (memoryCount > 0) {
    setShowMemoriesPage(true);
  }
};
```

---

## Step 6: Adding Title Field to Form

### 6.1 Add state for title

```tsx
const [title, setTitle] = useState<string>("");
```

### 6.2 Update form in JSX

Before the textarea, add:

```tsx
<div className="form-group">
  <label htmlFor="title" className="form-label">
    Title:
  </label>
  <input
    id="title"
    type="text"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    placeholder="Memory title..."
    className="memory-textarea"
    disabled={isSending || waitingForReceipt}
  />
</div>
```

---

## Step 7: Creating Memories Display Page

This section will be completed later. First, complete the previous steps.

---

## Important Notes

1. Always save the file after each change
2. Check the application in your browser
3. If you see any errors, let me know so I can help
4. Replace the app name and creator name in the relevant sections

---

## Questions?

If you encounter any problems or have questions at any step, feel free to ask!
