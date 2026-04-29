# User onboarding

## Roles in the system

| Role        | Who they are              | What they can do                                     |
| ----------- | ------------------------- | ---------------------------------------------------- |
| **Client**  | Buyer, purchasing manager | Browse the catalog, place orders                     |
| **Manager** | Sales manager             | View orders of their clients, configure stock alerts |
| **Admin**   | System administrator      | Full access + user management                        |

---

## For administrators

### Creating a user

1. Go to **Users** (in the site header)
2. Click **Create user**
3. Fill in:
   - **Name** and **Email**
   - **Temporary password** (at least 8 characters) — the user will change it on first login
   - **Role**: Client / Manager / Administrator
   - **Manager** (only for Client) — which manager the client is assigned to
   - **Price group** — the price list used to display prices to the client
4. Click **Create**

> On first login, the user is required to change the password.

### Price groups

Each client is assigned a price group — this determines which price list they see:

| Group           | Description       |
| --------------- | ----------------- |
| Прайс основной  | Base price        |
| Прайс 1 уровень | Wholesale level 1 |
| Прайс 2 уровень | Wholesale level 2 |
| Прайс Спот      | Internal client   |
| Прайс Субы      | Sub-distributors  |
| Прайс Градусы   | Градусы chain     |
| Прайс Пив.com   | Пив.com chain     |
| Прайс beer.exe  | beer.exe chain    |
| Прайс ХС        | ХмельСолод chain  |

If no price group is assigned — the client sees "Прайс основной".

### Resetting a password

1. In the users table, click the reset password icon next to the user
2. Enter a new temporary password
3. Click **Reset** — on next login the user is required to change it

### Deactivating a user

1. Click the edit icon
2. Toggle **Active** off
3. Click **Save** — the user can no longer log in

### Suspending activity

1. Click the edit icon
2. Toggle **Can order** off
3. Click **Save** — the user can no longer place orders, but can still log in and browse the catalog

---

## For managers

### Viewing client orders

The **Orders** section shows all orders from clients assigned to you.

All orders are displayed in chronological order. Status tracking (confirmed, shipped, delivered) will be implemented in future versions.

### Stock alerts

The **Alerts** section lets you configure notifications when product stock drops below a threshold.

1. Click **Add alert**
2. Choose a product and specify the minimum stock (in pieces or kegs)
3. Click **Create**

The system checks stock every hour. When a threshold is breached, an email is sent (no more than once every 24 hours per alert).

An alert can be temporarily disabled with a toggle without deleting it.

---

## For clients

### First login

1. Open the site and log in with the credentials you were given
2. The system will immediately ask you to change your password — pick a strong one (at least 8 characters)
3. You will be taken to the product catalog

### Working with the catalog

- Products are grouped by category — click a category header to collapse/expand it
- Use the search bar at the top to quickly find products by name
- Use the category filter — pick the category you need from the list at the top

What is shown in a product row:

- **Name** -- cleaned of technical markers
- **Stock** -- quantity (for kegs -- whole kegs)
- **Price** -- according to your price group
- **Volume** -- for kegs (10, 20, 30 L)

### Placing an order

1. Click **+** next to a product or enter the desired quantity in the field
2. The product is added to the cart (cart icon in the header)
3. Open the cart, check the list and quantities
4. Optionally add a comment to the order
5. Click **Place order**

The order will be assigned a number like `ORD-20260226-0001`. The manager will receive an email notification.

### Repeating an order

In the **Orders** section → open the desired order → click **Repeat order**. The system will create a new order with the same items.

### Cancelling an order (will be implemented in future versions of the application)

You can only cancel orders in **Pending** status. Open the order → **Cancel order**.

---

## FAQ

**I don't see prices for a product**
— A price group is most likely not assigned. Contact your administrator.

**The product is in the catalog, but stock is 0**
— The product is out of stock at the warehouse. Data is updated every 15 minutes.

**I forgot my password**
— Contact your administrator — they will reset the password and issue a new temporary one.

**I'm not receiving emails**
— Check your "Spam" folder. If the issue persists — contact your administrator.
