# Chat Feature

Real-time chat feature with WebSocket support.

## Structure

- `api/` - API calls and WebSocket service
- `components/` - React components
- `hooks/` - Custom hooks
- `types/` - TypeScript type definitions
- `mocks/` - Mock data and WebSocket for testing
- `chatSlice.ts` - Redux slice
- `chatThunks.ts` - Async thunks
- `chatSelectors.ts` - Redux selectors

## Features

- ✅ Real-time messaging via WebSocket
- ✅ Conversation list with search and filters
- ✅ Unread message tracking
- ✅ Typing indicators
- ✅ File/image upload
- ✅ Notifications with badge count
- ✅ Emoji picker
- ✅ Auto-scroll to latest message
- ✅ Message read status (double check)
- ✅ Responsive design

## Components

### ChatPage
Main container that integrates all chat components.

### ChatSidebar
- Search conversations
- Filter tabs (All/Unread/Read)
- Conversation list with unread badges

### ChatWindow
- Chat header with user info
- Message list with auto-scroll
- Typing indicator
- Message input area

### MessageInput
- Text input with auto-resize
- Emoji picker
- File/image upload with preview
- Send button

### NotificationBell
- Bell icon in header
- Badge count for unread notifications
- Dropdown panel

### NotificationPanel
- Tabs for unread/read notifications
- Notification list
- Mark all as read button

## Usage

```tsx
import { ChatPage } from './pages/Chat'
import { NotificationBell } from './features/chat/components'

// In your routes
<Route path="/chat" element={<ChatPage />} />

// In your header
<NotificationBell />
```

## Testing with Mock Data

For development and testing without a backend:

```typescript
import { mockConversations, mockMessages, mockNotifications } from './features/chat/mocks/mockData'
import { mockWebSocket } from './features/chat/mocks/mockWebSocket'

// Use mock data in your API calls
// Use mockWebSocket instead of real WebSocket
```

## API Endpoints Required

Backend needs to implement these endpoints:

```
GET    /api/v1/chat/conversations
GET    /api/v1/chat/conversations/:id
POST   /api/v1/chat/conversations
GET    /api/v1/chat/conversations/:id/messages
POST   /api/v1/chat/messages
PUT    /api/v1/chat/messages/:id/read
POST   /api/v1/chat/messages/upload

GET    /api/v1/notifications
PUT    /api/v1/notifications/:id/read
PUT    /api/v1/notifications/read-all
```

## WebSocket Events

### Client → Server
- `typing:start` - User started typing
- `typing:stop` - User stopped typing

### Server → Client
- `message:new` - New message received
- `message:read` - Message marked as read
- `typing:start` - Another user started typing
- `typing:stop` - Another user stopped typing
- `user:online` - User came online
- `user:offline` - User went offline

## Environment Variables

Add to `.env`:

```
VITE_WS_BASE_URL=ws://localhost:3000
```

## Dependencies

- `emoji-picker-react` - Emoji picker component
- `date-fns` - Date formatting utilities

## Future Enhancements

- [ ] Message reactions (emoji)
- [ ] Message editing/deletion
- [ ] Voice messages
- [ ] Video call integration
- [ ] Group chat support
- [ ] Message search
- [ ] Chat export
- [ ] Online status indicators
- [ ] Message delivery status
- [ ] Push notifications
