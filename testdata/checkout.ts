/**
 * testdata/checkout.ts
 */
export interface PaymentCard {
  label: string;
  nameOnCard: string;
  cardNumber: string;
  cvc: string;
  expiryMonth: string;
  expiryYear: string;
}

/** Data-driven bank cards for payment test */
export const PAYMENT_CARDS: PaymentCard[] = [
  {
    label: 'Visa Test Card',
    nameOnCard: 'Auto QA',
    cardNumber: '4242424242424242',
    cvc: '123',
    expiryMonth: '12',
    expiryYear: '2028',
  },
  {
    label: 'Mastercard Test Card',
    nameOnCard: 'Auto QA',
    cardNumber: '5555555555554444',
    cvc: '456',
    expiryMonth: '06',
    expiryYear: '2027',
  },
];

export const ORDER_COMMENT = 'Automated QA order - please ignore, thanks!';

/** Contact Us Form */
export interface ContactSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** To be blocked by HTML5 validation */
  expectBrowserValidation?: boolean;
}

export const CONTACT_INVALID_SUBMISSIONS: ContactSubmission[] = [
  {
    name: 'AutoQA',
    email: '', // Leave required email empty
    subject: 'Question about order',
    message: 'Where is my order?',
    expectBrowserValidation: true,
  },
  {
    name: 'AutoQA',
    email: 'not-an-email',
    subject: 'Question about order',
    message: 'Where is my order?',
    expectBrowserValidation: true,
  },
];
