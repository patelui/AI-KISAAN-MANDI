const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptPromise = null;

export const loadRazorpayScript = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay is only available in the browser'));
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = RAZORPAY_SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load Razorpay checkout'));
      document.body.appendChild(script);
    });
  }

  return scriptPromise;
};

export const openRazorpayCheckout = async ({ paymentData, onSuccess, onDismiss }) => {
  await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const options = {
      key: paymentData.keyId,
      amount: paymentData.amount,
      currency: paymentData.currency || 'INR',
      name: paymentData.name || 'AI Kisan Mandi',
      description: paymentData.description || 'Crop purchase',
      order_id: paymentData.razorpayOrderId,
      prefill: paymentData.prefill || {},
      theme: { color: '#059669' },
      handler: (response) => {
        onSuccess?.(response);
        resolve(response);
      },
      modal: {
        ondismiss: () => {
          onDismiss?.();
          reject(new Error('Payment cancelled'));
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', (response) => {
      reject(new Error(response.error?.description || 'Payment failed'));
    });
    razorpay.open();
  });
};
