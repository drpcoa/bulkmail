import serverless from 'serverless-http';
import { app } from '../backend/src/index';

// This file wraps the existing Express app to make it compatible with Netlify Functions.
// The `serverless` function from the `serverless-http` package takes the Express app
// as an argument and returns a handler function that can be exported.

export const handler = serverless(app);
