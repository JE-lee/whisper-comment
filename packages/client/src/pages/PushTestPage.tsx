import { useState, useEffect } from 'preact/hooks';
import { pushNotificationService } from '../services/pushNotification';
import { Bell, BellOff, Send, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TestStatus {
  serviceWorker: boolean;
  permission: boolean;
  subscription: boolean;
  vapidKey: boolean;
}

export default function PushTestPage() {
  const [status, setStatus] = useState<TestStatus>({
    serviceWorker: false,
    permission: false,
    subscription: false,
    vapidKey: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('Hello from WhisperComment! 🎉');

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const serviceWorkerSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    const permissionStatus = pushNotificationService.getPermissionStatus();
    const isSubscribed = await pushNotificationService.isSubscribed();
    
    setStatus({
      serviceWorker: serviceWorkerSupported,
      permission: permissionStatus.granted,
      subscription: isSubscribed,
      vapidKey: true // Assume VAPID key is available if service is running
    });
  };

  const initializeService = async () => {
    setIsLoading(true);
    try {
      const initialized = await pushNotificationService.initialize();
      if (initialized) {
        toast.success('Service Worker initialized successfully!');
        await checkStatus();
      } else {
        toast.error('Failed to initialize Service Worker');
      }
    } catch (error) {
      console.error('Error initializing service:', error);
      toast.error('Error initializing push service');
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = async () => {
    setIsLoading(true);
    try {
      const granted = await pushNotificationService.requestPermission();
      if (granted) {
        toast.success('Notification permission granted!');
        await checkStatus();
      } else {
        toast.error('Notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error('Error requesting notification permission');
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async () => {
    setIsLoading(true);
    try {
      const subscribed = await pushNotificationService.subscribe();
      if (subscribed) {
        toast.success('Successfully subscribed to push notifications!');
        await checkStatus();
      } else {
        toast.error('Failed to subscribe to push notifications');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error('Error subscribing to push notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const unsubscribed = await pushNotificationService.unsubscribe();
      if (unsubscribed) {
        toast.success('Successfully unsubscribed from push notifications!');
        await checkStatus();
      } else {
        toast.error('Failed to unsubscribe from push notifications');
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Error unsubscribing from push notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setIsLoading(true);
    try {
      const success = await pushNotificationService.sendTestNotification({
        title: 'Test Notification',
        body: testMessage,
        icon: '/icon-192x192.png'
      });
      
      if (success) {
        toast.success('Test notification sent!');
      } else {
        toast.error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Error sending test notification');
    } finally {
      setIsLoading(false);
    }
  };

  const StatusIcon = ({ isActive }: { isActive: boolean }) => (
    isActive ? 
      <CheckCircle class="w-5 h-5 text-green-500" /> : 
      <XCircle class="w-5 h-5 text-red-500" />
  );

  return (
    <div class="max-w-4xl mx-auto p-6 space-y-8">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Push Notification Test
        </h1>
        <p class="text-gray-600">
          Test the push notification functionality of WhisperComment
        </p>
      </div>

      {/* Status Overview */}
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Bell class="w-5 h-5" />
          System Status
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="font-medium">Service Worker Support</span>
            <StatusIcon isActive={status.serviceWorker} />
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="font-medium">VAPID Key Available</span>
            <StatusIcon isActive={status.vapidKey} />
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="font-medium">Notification Permission</span>
            <StatusIcon isActive={status.permission} />
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="font-medium">Push Subscription</span>
            <StatusIcon isActive={status.subscription} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4">Actions</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={initializeService}
            disabled={isLoading || status.serviceWorker}
            class="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Bell class="w-4 h-4" />
            Initialize Service
          </button>

          <button
            onClick={requestPermission}
            disabled={isLoading || status.permission}
            class="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle class="w-4 h-4" />
            Request Permission
          </button>

          <button
            onClick={subscribe}
            disabled={isLoading || !status.permission || status.subscription}
            class="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Bell class="w-4 h-4" />
            Subscribe
          </button>

          <button
            onClick={unsubscribe}
            disabled={isLoading || !status.subscription}
            class="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <BellOff class="w-4 h-4" />
            Unsubscribe
          </button>
        </div>
      </div>

      {/* Test Notification */}
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4">Send Test Notification</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Test Message
            </label>
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage((e.target as HTMLInputElement).value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter test message..."
            />
          </div>
          <button
            onClick={sendTestNotification}
            disabled={isLoading || !status.subscription}
            class="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full md:w-auto"
          >
            <Send class="w-4 h-4" />
            {isLoading ? 'Sending...' : 'Send Test Notification'}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div class="bg-blue-50 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-blue-900 mb-2">
          How to Test
        </h3>
        <ol class="list-decimal list-inside space-y-2 text-blue-800">
          <li>Click "Initialize Service" to register the Service Worker</li>
          <li>Click "Request Permission" to ask for notification permissions</li>
          <li>Click "Subscribe" to subscribe to push notifications</li>
          <li>Enter a test message and click "Send Test Notification"</li>
          <li>You should see a notification appear on your device</li>
        </ol>
      </div>
    </div>
  );
}