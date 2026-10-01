declare const window: any;

const API_BASE = '/api';

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const json = await response.json();

  if (!response.ok || json.success === false) {
    throw new Error(json.error || `API request failed with status ${response.status}`);
  }

  return json;
}

export const api = {
  login: (credentials: { username?: string; email?: string; password: string }) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  getState: () => apiRequest('/state'),

  saveMedicine: (medicine: any) =>
    apiRequest('/medicines/save', {
      method: 'POST',
      body: JSON.stringify(medicine)
    }),

  saveBatch: (batch: any) =>
    apiRequest('/batches/save', {
      method: 'POST',
      body: JSON.stringify(batch)
    }),

  adjustBatch: (data: { batchId: number; newQuantity: number; reason: string }) =>
    apiRequest('/batches/adjust', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  createSale: (saleData: any) =>
    apiRequest('/sales/create', {
      method: 'POST',
      body: JSON.stringify(saleData)
    }),

  savePurchase: (purchaseData: any) =>
    apiRequest('/purchases/save', {
      method: 'POST',
      body: JSON.stringify(purchaseData)
    }),

  saveCustomer: (customer: any) =>
    apiRequest('/customers/save', {
      method: 'POST',
      body: JSON.stringify(customer)
    }),

  saveSupplier: (supplier: any) =>
    apiRequest('/suppliers/save', {
      method: 'POST',
      body: JSON.stringify(supplier)
    }),

  savePrescription: (prescription: any) =>
    apiRequest('/prescriptions/save', {
      method: 'POST',
      body: JSON.stringify(prescription)
    }),

  saveExpense: (expense: any) =>
    apiRequest('/expenses/save', {
      method: 'POST',
      body: JSON.stringify(expense)
    }),

  saveUser: (user: any) =>
    apiRequest('/users/save', {
      method: 'POST',
      body: JSON.stringify(user)
    }),

  deleteUser: (id: number) =>
    apiRequest('/users/delete', {
      method: 'POST',
      body: JSON.stringify({ id })
    })
};
