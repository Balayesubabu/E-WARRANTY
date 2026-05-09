import express from 'express';
import { verifyToken } from '../../../middleware/verify-token.js';
import { createBookingSettingsEndpoint } from '../BookingSettings/create-booking-settings/index.js';
import { getBookingSettingsEndpoint } from './get-booking-settings/index.js';

const bookingSettingsRouter = express.Router();

bookingSettingsRouter.post('/create-booking-settings', verifyToken, createBookingSettingsEndpoint);
bookingSettingsRouter.get('/get-booking-settings', verifyToken, getBookingSettingsEndpoint);

export default bookingSettingsRouter;