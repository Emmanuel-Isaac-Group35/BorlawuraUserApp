
import { Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import HomePage from '../pages/home/page';
import BookingPage from '../pages/booking/page';
import OrdersPage from '../pages/orders/page';
import ServicesPage from '../pages/services/page';
import ProfilePage from '../pages/profile/page';
import SupportPage from '../pages/support/page';
import TrackOrderPage from '../pages/track-order/page';
import PaymentMethodsPage from '../pages/profile/payment-methods/page';
import NotificationsPage from '../pages/profile/notifications/page';
import ReferralPage from '../pages/profile/referral/page';
import TermsPage from '../pages/profile/terms/page';
import AboutPage from '../pages/profile/about/page';
import NotFound from '../pages/NotFound';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />
  },
  {
    path: '/booking',
    element: <BookingPage />
  },
  {
    path: '/orders',
    element: <OrdersPage />
  },
  {
    path: '/services',
    element: <ServicesPage />
  },
  {
    path: '/profile',
    element: <ProfilePage />
  },
  {
    path: '/profile/payment-methods',
    element: <PaymentMethodsPage />
  },
  {
    path: '/profile/notifications',
    element: <NotificationsPage />
  },
  {
    path: '/profile/referral',
    element: <ReferralPage />
  },
  {
    path: '/profile/terms',
    element: <TermsPage />
  },
  {
    path: '/profile/about',
    element: <AboutPage />
  },
  {
    path: '/support',
    element: <SupportPage />
  },
  {
    path: '/track-order',
    element: <TrackOrderPage />
  },
  {
    path: '*',
    element: <NotFound />
  }
];

export default routes;
