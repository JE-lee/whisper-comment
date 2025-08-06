import { useState, useEffect } from 'preact/hooks';
import { Bell, X, Check } from 'lucide-react';
import { pushNotificationService } from '../services/pushNotification';
import { toast } from 'sonner';

interface PushPermissionGuideProps {
  isVisible: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

export const PushPermissionGuide = ({
  isVisible,
  onClose,
  onPermissionGranted,
  onPermissionDenied
}: PushPermissionGuideProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'guide' | 'success' | 'error'>('guide');

  useEffect(() => {
    if (isVisible) {
      setStep('guide');
    }
  }, [isVisible]);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    
    try {
      // Initialize service worker
      const initialized = await pushNotificationService.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize push notifications');
      }

      // Request permission
      const permissionGranted = await pushNotificationService.requestPermission();
      if (!permissionGranted) {
        setStep('error');
        onPermissionDenied?.();
        toast.error('推送通知权限被拒绝');
        return;
      }

      // Subscribe to push notifications
      const subscribed = await pushNotificationService.subscribe();
      if (!subscribed) {
        throw new Error('Failed to subscribe to push notifications');
      }

      setStep('success');
      onPermissionGranted?.();
      toast.success('推送通知已启用！');
      
      // Auto close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      setStep('error');
      onPermissionDenied?.();
      toast.error('启用推送通知失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
    // Store user preference to not show again for this session
    sessionStorage.setItem('pushPermissionSkipped', 'true');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-in fade-in-0 zoom-in-95 duration-200">
        <button
          onClick={onClose}
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'guide' && (
          <>
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <Bell class="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  启用推送通知
                </h3>
                <p class="text-sm text-gray-500">
                  及时获取回复提醒
                </p>
              </div>
            </div>

            <div class="mb-6">
              <p class="text-gray-700 mb-4">
                感谢您的评论！启用推送通知后，当有人回复您的评论时，您将收到即时提醒。
              </p>
              
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-medium text-gray-900 mb-2">推送通知的好处：</h4>
                <ul class="text-sm text-gray-600 space-y-1">
                  <li>• 即时收到评论回复提醒</li>
                  <li>• 不错过重要的讨论</li>
                  <li>• 可随时在设置中关闭</li>
                </ul>
              </div>
            </div>

            <div class="flex space-x-3">
              <button
                onClick={handleEnableNotifications}
                disabled={isLoading}
                class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  '启用通知'
                )}
              </button>
              <button
                onClick={handleSkip}
                disabled={isLoading}
                class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                暂不启用
              </button>
            </div>
          </>
        )}

        {step === 'success' && (
          <div class="text-center">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check class="w-8 h-8 text-green-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              推送通知已启用！
            </h3>
            <p class="text-gray-600">
              您现在将收到评论回复的推送通知。
            </p>
          </div>
        )}

        {step === 'error' && (
          <>
            <div class="text-center mb-6">
              <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X class="w-8 h-8 text-red-600" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                启用失败
              </h3>
              <p class="text-gray-600">
                推送通知启用失败，您可以稍后在设置中重新启用。
              </p>
            </div>
            
            <div class="flex space-x-3">
              <button
                onClick={handleEnableNotifications}
                disabled={isLoading}
                class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                重试
              </button>
              <button
                onClick={onClose}
                class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                关闭
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};