/** The Business Module menu, grouped like MunshiBaba's Business Management System. */
export const BIZ_MENU: { group: string; items: [string, string][] }[] = [
  { group: "", items: [["/business", "Dashboard"]] },
  { group: "PURCHASE", items: [["/business/products", "Product Entry"], ["/business/purchase", "Direct Purchase"], ["/business/expense", "Expense Vouchers"], ["/business/vendors", "Vendors"]] },
  { group: "SALE", items: [["/business/sale", "Sale Invoice"], ["/business/customers", "Customers"]] },
  { group: "PAYMENTS", items: [["/business/payments/vendor", "Vendor Payments"], ["/business/payments/customer", "Customers Payments"]] },
  { group: "INVENTORY REPORT", items: [["/business/reports/stock-on-hand", "Stock On Hand Report"], ["/business/reports/stock-value", "Stock On Hand (With Value)"], ["/business/reports/low-inventory", "Low Inventory Report"]] },
  { group: "PURCHASE REPORTS", items: [["/business/reports/purchase-invoice", "Purchase Invoice"], ["/business/reports/product-purchase", "Product Purchase Report"], ["/business/reports/aged-payable", "Aged Account Payable Report"]] },
  { group: "SALES REPORT", items: [["/business/reports/sale-invoice", "Sale Invoice"], ["/business/reports/product-sale-customer", "Product Sale Customer Wise"], ["/business/reports/receive-money", "Receive Money Report"], ["/business/reports/aged-receivable", "Aged Account Receivable"], ["/business/reports/product-profit", "Product Wise Profit"]] },
  { group: "CUSTOMER REPORT", items: [["/business/reports/customer-ledger", "Customer Ledger Report"], ["/business/reports/customer-balance", "Customer Balance Report"], ["/business/reports/walk-in", "Walk In Customer"], ["/business/reports/customer-aging", "Customer Aging Report"]] },
  { group: "VENDOR REPORT", items: [["/business/reports/vendor-ledger", "Vendor Ledger Report"], ["/business/reports/vendor-balance", "Vendor Balance Report"], ["/business/reports/vendor-payment", "Vendor Payment Report"], ["/business/reports/vendor-aging", "Vendor Aging Report"]] },
  { group: "SETTING", items: [["/business/profile", "Business Profile"], ["/business/settings/warehouses", "Warehouses / Store's"], ["/business/settings/categories", "Product Categories"], ["/business/settings/taxes", "Tax Setup"], ["/business/settings/discounts", "Discount Setup"]] },
];
