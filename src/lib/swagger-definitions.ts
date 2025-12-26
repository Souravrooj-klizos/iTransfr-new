/**
 * @swagger
 * /client/login:
 *   post:
 *     tags:
 *       - Client Authentication
 *     summary: Client Login (Frontend Only)
 *     description: |
 *       **Note:** This is a frontend-only operation handled by Supabase Auth client.
 *
 *       Client login is performed through the iTransfr Client Portal UI using Supabase authentication.
 *       No backend API endpoint exists for login - authentication is handled by:
 *
 *       1. Email/password login via Supabase Auth
 *       2. Google OAuth via Supabase Auth
 *       3. Session cookies are automatically managed
 *       4. All subsequent API calls use the session cookie for authentication
 *
 *       **Frontend Implementation:**
 *       ```javascript
 *       const { data, error } = await supabase.auth.signInWithPassword({
 *         email: 'user@example.com',
 *         password: 'password123'
 *       });
 *       ```
 *     security: []
 *     responses:
 *       200:
 *         description: Login successful (handled by frontend Supabase client)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login handled by Supabase Auth client"
 */

/**
 * @swagger
 * /client/logout:
 *   post:
 *     tags:
 *       - Client Authentication
 *     summary: Client Logout (Frontend Only)
 *     description: |
 *       **Note:** This is a frontend-only operation handled by Supabase Auth client.
 *
 *       Client logout is performed through the Supabase Auth client, which clears session cookies.
 *
 *       **Frontend Implementation:**
 *       ```javascript
 *       const { error } = await supabase.auth.signOut();
 *       ```
 *     security: []
 *     responses:
 *       200:
 *         description: Logout successful (handled by frontend Supabase client)
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     tags:
 *       - Client Authentication
 *     summary: User signup
 *     description: Create a new client user account (no authentication required)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/admin/auth/verify:
 *   post:
 *     tags:
 *       - Admin Authentication
 *     summary: Verify admin access
 *     description: Verify if a user has admin privileges
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID to verify
 *     responses:
 *       200:
 *         description: Admin verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isAdmin:
 *                   type: boolean
 *                   description: Whether user is admin
 *                 role:
 *                   type: string
 *                   description: Admin role (if admin)
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/otp/send:
 *   post:
 *     tags:
 *       - Client Authentication
 *     summary: Send OTP
 *     description: Send OTP verification code to email (no authentication required)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP sent successfully"
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/otp/verify:
 *   post:
 *     tags:
 *       - Client Authentication
 *     summary: Verify OTP
 *     description: Verify OTP code sent to email (no authentication required)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *               otp:
 *                 type: string
 *                 description: OTP code
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP verified successfully"
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/complete-profile:
 *   post:
 *     tags:
 *       - Client Authentication
 *     summary: Complete user profile
 *     description: Complete user profile setup after signup
 *     security:
 *       - clientAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: First name
 *               lastName:
 *                 type: string
 *                 description: Last name
 *               companyName:
 *                 type: string
 *                 description: Company name
 *               mobile:
 *                 type: string
 *                 description: Mobile number
 *               countryCode:
 *                 type: string
 *                 description: Country code
 *     responses:
 *       200:
 *         description: Profile completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile completed successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/upload-kyc:
 *   post:
 *     tags:
 *       - Client KYC
 *     summary: Upload KYC documents
 *     description: Upload KYC verification documents
 *     security:
 *       - clientAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: KYC document files
 *               documentType:
 *                 type: string
 *                 enum: [passport, id_card, drivers_license, utility_bill, bank_statement]
 *                 description: Type of document being uploaded
 *     responses:
 *       200:
 *         description: Documents uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "KYC documents uploaded successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/transactions/deposit:
 *   post:
 *     tags:
 *       - Client Transactions
 *     summary: Create deposit request
 *     description: Create a new deposit transaction request
 *     security:
 *       - clientAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DepositRequest'
 *     responses:
 *       200:
 *         description: Deposit request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DepositResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: KYC required or transaction blocked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     tags:
 *       - Client Transactions
 *     summary: Get user deposits
 *     description: Get all deposit transactions for authenticated user
 *     security:
 *       - clientAuth: []
 *     responses:
 *       200:
 *         description: Deposits retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deposits:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 count:
 *                   type: integer
 *                   description: Number of deposits
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/transactions/payout:
 *   post:
 *     tags:
 *       - Client Transactions
 *     summary: Create payout request
 *     description: Create a new payout transaction request
 *     security:
 *       - clientAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currency
 *               - recipientId
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Payout amount
 *               currency:
 *                 type: string
 *                 description: Currency code
 *               recipientId:
 *                 type: string
 *                 description: Recipient ID
 *     responses:
 *       200:
 *         description: Payout request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 transactionId:
 *                   type: string
 *                   description: Transaction ID
 *                 reference:
 *                   type: string
 *                   description: Transaction reference
 *                 message:
 *                   type: string
 *                   example: "Payout request created successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: KYC required or transaction blocked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/admin/dashboard/stats:
 *   get:
 *     tags:
 *       - Admin Dashboard
 *     summary: Get dashboard statistics
 *     description: Get admin dashboard statistics including client counts, KYC stats, and recent activity
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalClients:
 *                       type: integer
 *                       description: Total number of clients
 *                     pendingKYC:
 *                       type: integer
 *                       description: Number of pending KYC requests
 *                     approvedKYC:
 *                       type: integer
 *                       description: Number of approved KYC requests
 *                     rejectedKYC:
 *                       type: integer
 *                       description: Number of rejected KYC requests
 *                     pendingTransactions:
 *                       type: integer
 *                       description: Number of pending transactions
 *                     completedTransactions:
 *                       type: integer
 *                       description: Number of completed transactions
 *                 recentKYC:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       client_profiles:
 *                         type: object
 *                         properties:
 *                           first_name:
 *                             type: string
 *                           last_name:
 *                             type: string
 *                           company_name:
 *                             type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/admin/kyc/list:
 *   get:
 *     tags:
 *       - Admin KYC Management
 *     summary: List all KYC records
 *     description: Get all KYC records for admin review
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: KYC records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 kycRecords:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/KYCRecord'
 *                       - type: object
 *                         properties:
 *                           client_profiles:
 *                             type: object
 *                             properties:
 *                               first_name:
 *                                 type: string
 *                               last_name:
 *                                 type: string
 *                               company_name:
 *                                 type: string
 *                           kyc_documents:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 documentType:
 *                                   type: string
 *                                 fileName:
 *                                   type: string
 *                                 uploadedAt:
 *                                   type: string
 *                                   format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/admin/kyc/{id}/update-status:
 *   post:
 *     tags:
 *       - Admin KYC Management
 *     summary: Update KYC status
 *     description: Approve or reject a KYC application
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: KYC record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *                 description: New KYC status
 *               notes:
 *                 type: string
 *                 description: Admin notes
 *     responses:
 *       200:
 *         description: KYC status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "KYC status updated successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: KYC record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/admin/transactions/list:
 *   get:
 *     tags:
 *       - Admin Transaction Management
 *     summary: List all transactions
 *     description: Get all transactions for admin review
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Transaction'
 *                       - type: object
 *                         properties:
 *                           client_profiles:
 *                             type: object
 *                             properties:
 *                               first_name:
 *                                 type: string
 *                               last_name:
 *                                 type: string
 *                               company_name:
 *                                 type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/admin/transactions/{id}/update:
 *   post:
 *     tags:
 *       - Admin Transaction Management
 *     summary: Update transaction
 *     description: Update transaction status (mark received, execute swap, send payout)
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [mark_received, execute_swap, send_payout]
 *                 description: Action to perform on transaction
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 newStatus:
 *                   type: string
 *                   description: New transaction status
 *                 message:
 *                   type: string
 *                   example: "Transaction updated successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/admin/payouts/list:
 *   get:
 *     tags:
 *       - Admin Payout Management
 *     summary: List pending payouts
 *     description: Get all pending payout transactions for admin processing
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Payouts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payouts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/admin/payouts/{id}/send:
 *   post:
 *     tags:
 *       - Admin Payout Management
 *     summary: Send payout
 *     description: Process and send a payout transaction
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Payout transaction ID
 *     responses:
 *       200:
 *         description: Payout sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Payout sent successfully"
 *                 transactionId:
 *                   type: string
 *                   description: Transaction ID
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/integrations/bitso/quote:
 *   post:
 *     tags:
 *       - Admin Integrations
 *     summary: Get Bitso exchange quote
 *     description: Get currency exchange quote from Bitso
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromCurrency
 *               - toCurrency
 *               - amount
 *             properties:
 *               fromCurrency:
 *                 type: string
 *                 description: Source currency
 *               toCurrency:
 *                 type: string
 *                 description: Target currency
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Amount to exchange
 *     responses:
 *       200:
 *         description: Quote retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 quote:
 *                   type: object
 *                   properties:
 *                     fromCurrency:
 *                       type: string
 *                     toCurrency:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     exchangeRate:
 *                       type: number
 *                     convertedAmount:
 *                       type: number
 *                     fees:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/integrations/infinitus/payout:
 *   post:
 *     tags:
 *       - Admin Integrations
 *     summary: Process Infinitus payout
 *     description: Send payout through Infinitus payment processor
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currency
 *               - recipientDetails
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Payout amount
 *               currency:
 *                 type: string
 *                 description: Currency code
 *               recipientDetails:
 *                 type: object
 *                 description: Recipient bank details
 *     responses:
 *       200:
 *         description: Payout processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 payoutId:
 *                   type: string
 *                   description: Infinitus payout ID
 *                 status:
 *                   type: string
 *                   example: "processed"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/kyc/amlbot-forms:
 *   get:
 *     tags:
 *       - Admin Integrations
 *     summary: Get AMLBot forms
 *     description: Get available AMLBot KYC forms
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Forms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 forms:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/kyc/submit-amlbot:
 *   post:
 *     tags:
 *       - Admin Integrations
 *     summary: Submit AMLBot KYC
 *     description: Submit KYC data to AMLBot for verification
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - formId
 *               - formData
 *             properties:
 *               formId:
 *                 type: string
 *                 description: AMLBot form ID
 *               formData:
 *                 type: object
 *                 description: KYC form data
 *     responses:
 *       200:
 *         description: KYC submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 kycId:
 *                   type: string
 *                   description: KYC record ID
 *                 status:
 *                   type: string
 *                   example: "pending"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/webhooks/amlbot:
 *   post:
 *     tags:
 *       - Admin Webhooks
 *     summary: AMLBot webhook
 *     description: Receive KYC status updates from AMLBot (no authentication required - external webhook)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kycId
 *               - status
 *             properties:
 *               kycId:
 *                 type: string
 *                 description: KYC record ID
 *               status:
 *                 type: string
 *                 enum: [approved, rejected, pending]
 *                 description: KYC verification status
 *               riskScore:
 *                 type: number
 *                 description: Risk assessment score
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/integrations/bitso/test:
 *   get:
 *     tags:
 *       - Admin Integrations
 *     summary: Test Bitso connection
 *     description: Test connection to Bitso API and get account balances
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Connection test result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     balances:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           currency:
 *                             type: string
 *                           available:
 *                             type: string
 *                           total:
 *                             type: string
 *       500:
 *         description: Connection failed
 */

/**
 * @swagger
 * /api/integrations/bitso/execute:
 *   post:
 *     tags:
 *       - Admin Integrations
 *     summary: Execute Bitso swap
 *     description: Execute currency exchange on Bitso
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quoteId:
 *                 type: string
 *                 description: Quote ID from previous quote request
 *               fromCurrency:
 *                 type: string
 *                 description: Source currency (if no quoteId)
 *               toCurrency:
 *                 type: string
 *                 description: Target currency (if no quoteId)
 *               amount:
 *                 type: number
 *                 description: Amount to exchange (if no quoteId)
 *               transactionId:
 *                 type: string
 *                 description: Optional transaction ID to link
 *     responses:
 *       200:
 *         description: Swap executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 conversion:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                     fromAmount:
 *                       type: string
 *                     toAmount:
 *                       type: string
 *                     rate:
 *                       type: string
 *       400:
 *         description: Insufficient balance or invalid request
 *       500:
 *         description: Server error
 *   get:
 *     tags:
 *       - Admin Integrations
 *     summary: Get Bitso conversion status
 *     description: Get status of an existing Bitso conversion
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversion ID
 *     responses:
 *       200:
 *         description: Conversion status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 conversion:
 *                   type: object
 *       404:
 *         description: Conversion not found
 */

/**
 * @swagger
 * /api/integrations/turnkey/test:
 *   get:
 *     tags:
 *       - Admin Integrations
 *     summary: Test Turnkey connection
 *     description: Test connection to Turnkey API
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Connection test result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     organizationId:
 *                       type: string
 *                     walletCount:
 *                       type: integer
 *       500:
 *         description: Connection failed
 */

/**
 * @swagger
 * /api/integrations/turnkey/wallet:
 *   post:
 *     tags:
 *       - Admin Integrations
 *     summary: Create Turnkey wallet
 *     description: Create a new multi-chain wallet (Ethereum, Solana, Tron)
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID to create wallet for
 *               userName:
 *                 type: string
 *                 description: User name for wallet naming
 *               currency:
 *                 type: string
 *                 enum: [USDT, USDC, USDG]
 *                 description: Currency for database tracking
 *     responses:
 *       200:
 *         description: Wallet created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 wallet:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     accounts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           address:
 *                             type: string
 *                           format:
 *                             type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 *   get:
 *     tags:
 *       - Admin Integrations
 *     summary: List or get Turnkey wallets
 *     description: List all wallets or get specific wallet by ID
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - name: id
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Wallet ID (optional, returns all if not provided)
 *     responses:
 *       200:
 *         description: Wallet(s) retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     wallet:
 *                       type: object
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     wallets:
 *                       type: array
 *                       items:
 *                         type: object
 *                     count:
 *                       type: integer
 */

/**
 * @swagger
 * /api/integrations/infinitus/test:
 *   get:
 *     tags:
 *       - Admin Integrations
 *     summary: Test Infinitus connection
 *     description: Test connection to Infinitus API and get supported countries
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Connection test result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     environment:
 *                       type: string
 *                       enum: [sandbox, production]
 *                     supportedCountries:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           country:
 *                             type: string
 *                           currencies:
 *                             type: array
 *                             items:
 *                               type: string
 *                           paymentMethods:
 *                             type: array
 *                             items:
 *                               type: string
 *       500:
 *         description: Connection failed
 */

/**
 * @swagger
 * /api/integrations/infinitus/payout:
 *   get:
 *     tags:
 *       - Admin Integrations
 *     summary: Get payout status or list payouts
 *     description: Get specific payout status by ID or list all payouts
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - name: id
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Payout ID (optional)
 *       - name: status
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *         description: Number of payouts to return
 *     responses:
 *       200:
 *         description: Payout(s) retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     payout:
 *                       type: object
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     payouts:
 *                       type: array
 *                       items:
 *                         type: object
 *                     count:
 *                       type: integer
 *   delete:
 *     tags:
 *       - Admin Integrations
 *     summary: Cancel pending payout
 *     description: Cancel a payout that is still pending
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Payout ID to cancel
 *     responses:
 *       200:
 *         description: Payout cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 payout:
 *                   type: object
 *       400:
 *         description: Payout ID required or cannot cancel
 *       500:
 *         description: Server error
 */
