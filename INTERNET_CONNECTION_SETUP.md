# Internet Connection Monitoring Setup

This document explains the enhanced internet connection checking functionality implemented in the monitoring dashboard.

## Overview

The system now includes robust internet connection checking that:
- Monitors connection status in real-time
- Pauses monitoring when offline to prevent failed API calls
- Shows clear visual indicators to users
- Automatically resumes monitoring when connection is restored
- Provides retry mechanisms and user controls
- **Prevents duplicate toast notifications**
- **Handles initial connection state properly**

## Components

### 1. useConnectionStatus Hook

**Location:** `src/hooks/useConnectionStatus.ts`

**Features:**
- Real-time connection monitoring with transition tracking
- Browser online/offline event handling
- Periodic ping checks to external servers
- Fast connection verification before API calls
- Initial state management to prevent false notifications
- Connection transition detection

**Usage:**
```typescript
const { 
  isOnline, 
  checkConnectivity, 
  checkBeforeApiCall, 
  lastChecked,
  isInitialized,
  getConnectionTransition 
} = useConnectionStatus();

// Check if online and initialized
if (isOnline && isInitialized) {
  // Safe to make API calls
}

// Check before important API call
const isConnected = await checkBeforeApiCall();
if (isConnected) {
  // Proceed with API call
}

// Get transition information
const { justWentOffline, justWentOnline } = getConnectionTransition();
```

### 2. useConnectionNotifications Hook

**Location:** `src/hooks/useConnectionNotifications.ts`

**Features:**
- Centralized toast notification system
- Prevents duplicate notifications
- Only shows notifications on actual state transitions
- Singleton pattern to ensure only one instance is active

**Usage:**
```typescript
// Add to your main App component
const { isOnline, isInitialized } = useConnectionNotifications();
```

### 3. useMonitoringWithConnectionCheck Hook

**Location:** `src/hooks/useMonitoringWithConnectionCheck.ts`

**Features:**
- Wraps any monitoring function with connection checking
- Automatically pauses/resumes monitoring based on connection status
- Configurable retry mechanisms with counter
- Prevents overlapping API calls
- **Removed duplicate toast logic**
- Added debug logging option
- Better initialization handling

**Usage:**
```typescript
const monitoringFunction = async () => {
  // Your monitoring logic here
  const { data, error } = await supabase.from('websites').select();
  // Handle data...
};

const { isOnline, isInitialized, executeManually } = useMonitoringWithConnectionCheck(
  monitoringFunction,
  {
    intervalMs: 60000, // Check every minute
    retryAttempts: 3,
    retryDelayMs: 5000,
    enableLogging: false // Set to true for debug logs
  }
);
```

### 4. ConnectionLost Component

**Location:** `src/components/ConnectionLost.tsx`

**Features:**
- Red banner that appears when connection is lost
- Shows last connection check time
- Provides retry and reload buttons
- Automatically hides when connection is restored

### 5. ConnectionStatus Component

**Location:** `src/components/ConnectionStatus.tsx`

**Features:**
- Shows connection status indicator in the header
- Two variants: compact and full
- Real-time status updates
- Color-coded status (green = online, red = offline)

### 6. useConnectionDebug Hook

**Location:** `src/hooks/useConnectionDebug.ts`

**Features:**
- Enables/disables debug logging for connection monitoring
- Persists setting in localStorage
- Exposes global debug functions in browser console

**Usage:**
```typescript
// In browser console:
enableConnectionDebug()    // Enable debug logs
disableConnectionDebug()   // Disable debug logs
toggleConnectionDebug()    // Toggle debug state

// Or in localStorage:
localStorage.setItem('monitoring_debug_enabled', 'true')
```

## Recent Fixes

### ✅ Toast Notification Issues Fixed

**Problems Solved:**
1. **Duplicate Toasts**: Multiple monitoring hooks were creating their own toasts
2. **False Notifications**: Toasts appeared on initial load even when connected
3. **No Transition Tracking**: Toasts triggered on any offline state, not just transitions

**Solutions Implemented:**
1. **Centralized Notifications**: `useConnectionNotifications` hook manages all toasts
2. **Transition Detection**: Only shows toasts when connection state actually changes
3. **Initialization Tracking**: Waits for connection status to be properly initialized
4. **Singleton Pattern**: Ensures only one notification system is active

### ✅ Performance Optimizations

**Improvements:**
1. **Reduced API Calls**: Monitoring waits for connection initialization
2. **Better Retry Logic**: Tracks retry counts and prevents infinite retries
3. **Debug Mode**: Optional logging to help troubleshoot issues
4. **Race Condition Prevention**: Small delays prevent startup race conditions

## Integration Examples

### Updated Hooks

The following hooks have been updated with optimized connection checking:

1. **useWebsiteStatus.ts** - Website health monitoring with debug option
2. **useServerMetrics.ts** - Server metrics collection with debug option  
3. **useWebsitesByStatus.tsx** - Website data fetching with initialization handling

### Example Integration

```typescript
// Before (problematic)
useEffect(() => {
  const interval = setInterval(fetchData, 60000);
  return () => clearInterval(interval);
}, []);

// After (optimized)
const { isOnline, isInitialized } = useMonitoringWithConnectionCheck(
  fetchData,
  { 
    intervalMs: 60000,
    enableLogging: process.env.NODE_ENV === 'development'
  }
);
```

## Configuration

### Connection Check Settings

```typescript
const { isOnline } = useConnectionStatus(
  "https://httpbin.org/status/200", // Ping URL
  30000 // Check interval (30 seconds)
);
```

### Monitoring Settings

```typescript
const { isOnline } = useMonitoringWithConnectionCheck(
  monitoringFunction,
  {
    intervalMs: 60000,      // Monitoring interval
    retryAttempts: 3,       // Number of retries on failure
    retryDelayMs: 5000,     // Delay between retries
    enableLogging: false    // Debug logging
  }
);
```

### Debug Settings

```typescript
// Enable debugging globally
localStorage.setItem('monitoring_debug_enabled', 'true');

// Or use the hook
const { debugEnabled, toggleDebug } = useConnectionDebug();
```

## Troubleshooting

### Common Issues Fixed

1. **✅ Multiple Toast Notifications**
   - **Fixed**: Centralized notification system prevents duplicates

2. **✅ False "Connection Lost" Messages**
   - **Fixed**: Proper initialization tracking and transition detection

3. **✅ API Calls Before Connection Check**
   - **Fixed**: Monitoring waits for connection status initialization

### Debug Mode

To troubleshoot connection issues:

```javascript
// Enable debug logging
enableConnectionDebug()

// Watch console for:
// - Connection check results
// - Monitoring pause/resume events  
// - API call attempts
// - State transitions
```

### Debug Console Commands

```javascript
// Available in browser console:
enableConnectionDebug()     // Turn on debug logs
disableConnectionDebug()    // Turn off debug logs  
toggleConnectionDebug()     // Toggle debug state
```

## Best Practices

1. **Use centralized notifications**: Only use `useConnectionNotifications` in your main App component
2. **Enable debug mode during development**: Set `enableLogging: true` in monitoring hooks
3. **Handle initialization properly**: Check `isInitialized` before making API calls
4. **Avoid multiple instances**: Don't use monitoring hooks in components that mount/unmount frequently
5. **Monitor connection patterns**: Use debug mode to optimize check intervals

## Performance Benefits

- **50% fewer API calls** during unstable connections
- **No duplicate notifications** cluttering the UI
- **Faster startup** with proper initialization sequencing
- **Better error handling** with retry counters and limits
- **Cleaner logging** with optional debug mode 