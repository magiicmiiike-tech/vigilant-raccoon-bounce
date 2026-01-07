# 🍿 Dyad Snacks

This template comes configured with the bare minimum to get started on anything you need.

## Features

### 🌟 Public Features (No Authentication Required)
- **Browse Snacks**: View all available snack items with images, descriptions, prices, and categories
- **Responsive Design**: Fully responsive interface that works on desktop, tablet, and mobile devices

### 👤 Authenticated User Features
- **User Registration & Login**: Secure authentication system
- **Place Orders**: Add snacks to cart and place orders
- **Order History**: View personal order history with status tracking
- **Order Tracking**: See order status (Pending, Completed, Cancelled)

### 🔧 Admin Features
- **Admin Dashboard**: Comprehensive order management interface
- **Order Management**: Review all orders from all customers
- **Status Updates**: Update order status (Pending → Completed/Cancelled)
- **Order Statistics**: View summary statistics of all orders
- **Snack Management**: Add, edit, and manage snack inventory through Payload CMS admin panel

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Payload CMS 3.0
- **Database**: Vercel Postgres
- **Authentication**: Built-in Payload authentication with role-based access
- **Styling**: Custom CSS with modern responsive design
- **Media**: Sharp for image processing

## User Roles

### Regular Users (`role: 'user'`)
- Can view all available snacks
- Can place orders for snacks
- Can view their own order history
- Cannot modify or cancel orders once placed

### Admin Users (`role: 'admin'`)
- All regular user permissions
- Can access admin dashboard
- Can view all orders from all customers  
- Can update order status
- Can manage snack inventory through CMS admin panel

## Collections

### Users
- Email, first name, last name
- Role-based authentication (user/admin)
- Default role: 'user'

### Snacks
- Name, description, price, category
- Image upload with media relation
- Availability toggle
- Categories: Chips, Candy, Cookies, Nuts, Crackers, Drinks

### Orders
- User relationship
- Array of items (snack + quantity)
- Total amount calculation
- Status tracking (pending/completed/cancelled)
- Order date tracking

### Media
- Image upload and management
- Alt text for accessibility

## Getting Started

### Prerequisites
- Node.js 18+ or 20+
- pnpm 9+ or 10+
- PostgreSQL database (Vercel Postgres recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dyad-snacks
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your environment variables:
   ```env
   PAYLOAD_SECRET=your-secret-key
   POSTGRES_URL=your-postgres-connection-string
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

### First Time Setup

1. **Create Admin User**: Visit `/admin` to create your first admin user
2. **Add Snacks**: Use the admin panel to add snack items with images
3. **Test Ordering**: Create a regular user account to test the ordering flow

## API Endpoints

### Orders
- `POST /api/orders` - Create a new order (authenticated users)
- `PATCH /api/orders/update-status` - Update order status (admin only)

### Built-in Payload Endpoints
- `/api/users` - User management
- `/api/snacks` - Snack management  
- `/api/media` - Media upload/management
- `/admin` - Admin panel access

## Application Flow

### For Visitors (Unauthenticated)
1. **Homepage**: Browse all available snacks
2. **Login Required**: Click "Login to Order" to authenticate
3. **Registration**: Create account with first name, last name, email, password

### For Regular Users
1. **Browse & Order**: View snacks and click "Order Now"
2. **Order Form**: Select quantity and place order
3. **Order Confirmation**: Redirected to "My Orders" with success message
4. **Order History**: View all personal orders with status

### For Admin Users
1. **Admin Dashboard**: Access via navigation or direct link  
2. **Order Overview**: See statistics and all orders
3. **Status Management**: Update order status with real-time buttons
4. **Inventory Management**: Access full CMS admin panel

## Responsive Design

The application is fully responsive with breakpoints:
- **Desktop**: 1200px+ (full grid layout, side-by-side forms)
- **Tablet**: 768px-1199px (adapted grid, stacked layouts)
- **Mobile**: <768px (single column, touch-friendly buttons)

## Security Features

- **Role-based Access Control**: Proper separation of user and admin permissions
- **Authentication Required**: Protected routes for ordering and admin functions
- **Data Validation**: Server-side validation for all order data
- **Price Verification**: Server validates prices to prevent manipulation

## Deployment

### Using Payload Cloud
1. Connect your repository to Payload Cloud
2. Configure environment variables
3. Deploy automatically with MongoDB and S3 storage

### Using Vercel
1. Connect repository to Vercel
2. Configure Vercel Postgres database
3. Set environment variables
4. Deploy

## Development Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm generate:types  # Generate TypeScript types
pnpm lint         # Run ESLint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For questions or issues:
- Check the [Payload CMS documentation](https://payloadcms.com/docs)
- Review the Next.js documentation
- Open an issue in the repository

---

**Built with ❤️ using Payload CMS and Next.js**
