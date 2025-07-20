import { Router } from 'express';
import { body } from 'express-validator';
import { emailController } from '../controllers/email.controller';

export const emailRouter = Router();

// Validation middleware
const validateEmail = [
  body('to')
    .notEmpty().withMessage('Recipient email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('subject').notEmpty().withMessage('Email subject is required'),
  body('text')
    .if((value, { req }) => !req.body.html)
    .notEmpty().withMessage('Either text or html content is required'),
  body('html')
    .if((value, { req }) => !req.body.text)
    .notEmpty().withMessage('Either text or html content is required'),
  body('provider').optional().isString(),
];

const validateBatch = [
  body('emails').isArray({ min: 1 }).withMessage('At least one email is required'),
  body('emails.*.to')
    .notEmpty().withMessage('Recipient email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('emails.*.subject').notEmpty().withMessage('Email subject is required'),
  body('emails.*.text')
    .if((value, { req, path }) => {
      const index = parseInt(path.split('.')[1], 10);
      return !req.body.emails[index]?.html;
    })
    .notEmpty().withMessage('Either text or html content is required'),
  body('emails.*.html')
    .if((value, { req, path }) => {
      const index = parseInt(path.split('.')[1], 10);
      return !req.body.emails[index]?.text;
    })
    .notEmpty().withMessage('Either text or html content is required'),
  body('concurrency').optional().isInt({ min: 1, max: 20 })
    .withMessage('Concurrency must be between 1 and 20'),
  body('provider').optional().isString(),
];

// Routes
emailRouter.post('/send', validateEmail, emailController.sendEmail.bind(emailController));
emailRouter.post('/send-batch', validateBatch, emailController.sendBatch.bind(emailController));
emailRouter.get('/providers', emailController.getProviders.bind(emailController));
emailRouter.post('/providers/default', 
  [
    body('provider').notEmpty().withMessage('Provider name is required').isString(),
  ],
  emailController.setDefaultProvider.bind(emailController)
);

export default emailRouter;
