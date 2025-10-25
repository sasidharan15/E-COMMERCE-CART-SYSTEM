# E-Commerce Cart System

1. Copy .env.example to .env and set values.
2. Install dependencies: npm install
3. Run dev: npm run dev
4. Create some products via POST /api/products
5. Register a user: POST /api/auth/register
6. Login and use the returned token (Authorization: Bearer <token>) or sessions if AUTH_METHOD=session.
7. Add to cart: POST /api/cart { productId, quantity }
8. View cart: GET /api/cart
9. Checkout: POST /api/checkout { couponCode? }
