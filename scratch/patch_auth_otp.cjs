const fs = require('fs');

let authCode = fs.readFileSync('src/modules/auth/auth.controller.ts', 'utf8');

const otpMethods = \`
  // Request OTP for Email Login
  static async requestOtpLogin(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) return sendError(res, 400, 'Email is required');

      // 1. Find User
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) return sendError(res, 404, 'User not found');

      // 2. Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 3. Hash OTP and store
      const { otpCodes } = require('../../db/schema.ts');
      
      // Delete old OTPs for this email
      await db.delete(otpCodes).where(eq(otpCodes.identifier, email));
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);
      
      await db.insert(otpCodes).values({
        channel: 'EMAIL',
        identifier: email,
        codeHash: hashPassword(otp), // Reusing password hasher for OTP
        expiresAt
      });

      // 4. Send Email (Simulated)
      console.log(\`[EMAIL MOCK] Sending OTP \${otp} to \${email}\`);
      
      return sendSuccess(res, null, 'OTP sent to your email');
    } catch (err: any) {
      return sendError(res, 500, err.message);
    }
  }

  // Verify OTP and Login
  static async verifyOtpLogin(req: Request, res: Response) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) return sendError(res, 400, 'Email and OTP required');

      // 1. Find OTP
      const { otpCodes } = require('../../db/schema.ts');
      const [otpRecord] = await db.select().from(otpCodes)
        .where(eq(otpCodes.identifier, email));
        
      if (!otpRecord) return sendError(res, 400, 'Invalid or expired OTP');
      if (new Date() > new Date(otpRecord.expiresAt)) {
        await db.delete(otpCodes).where(eq(otpCodes.identifier, email));
        return sendError(res, 400, 'OTP expired');
      }

      if (!verifyPassword(otp, otpRecord.codeHash)) {
        // Increment attempts (simplified here)
        return sendError(res, 400, 'Incorrect OTP');
      }

      // OTP Valid! Delete it
      await db.delete(otpCodes).where(eq(otpCodes.identifier, email));

      // 2. Load User
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) return sendError(res, 404, 'User not found');

      // Load Role
      const [roleRec] = user.roleId ? await db.select().from(roles).where(eq(roles.id, user.roleId)) : [null];
      const roleName = roleRec ? roleRec.name : 'TENANT';

      // Load Org
      const [org] = await db.select().from(organizations).where(eq(organizations.id, user.organizationId));

      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-development-only';
      const token = require('jsonwebtoken').sign({ 
        id: user.id, 
        email: user.email, 
        organizationId: user.organizationId,
        role: roleName,
        tenantId: user.roleId ? undefined : user.id
      }, jwtSecret, { expiresIn: '7d' });

      return sendSuccess(res, {
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: roleName,
          organizationId: user.organizationId,
          organization: org ? { name: org.name, slug: org.slug, subscriptionStatus: org.subscriptionStatus } : null
        }
      }, 'Login successful');

    } catch (err: any) {
      return sendError(res, 500, err.message);
    }
  }
\`;

if (!authCode.includes('requestOtpLogin')) {
  authCode = authCode.replace('static async register(req: Request, res: Response) {', otpMethods + '\\n  static async register(req: Request, res: Response) {');
  fs.writeFileSync('src/modules/auth/auth.controller.ts', authCode);
  console.log('Patched auth controller');
}

let routesCode = fs.readFileSync('src/modules/auth/auth.routes.ts', 'utf8');
if (!routesCode.includes('otp-request')) {
  routesCode = routesCode.replace('authRouter.post(\\'/login\\', AuthController.login);', 
    'authRouter.post(\\'/login\\', AuthController.login);\\nauthRouter.post(\\'/login/otp-request\\', AuthController.requestOtpLogin);\\nauthRouter.post(\\'/login/otp-verify\\', AuthController.verifyOtpLogin);'
  );
  fs.writeFileSync('src/modules/auth/auth.routes.ts', routesCode);
  console.log('Patched auth routes');
}

