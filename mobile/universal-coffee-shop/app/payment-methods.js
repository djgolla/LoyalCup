/**
 * Payment methods — removed for v1 launch.
 * Redirects back immediately so no dead screen is ever shown.
 */
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  useEffect(() => {
    router.back();
  }, []);
  return null;
}