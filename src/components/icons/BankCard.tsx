const BankCard = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='27'
      height='22'
      viewBox='0 0 27 22'
      fill='none'
      className={className}
    >
      <path
        d='M26.875 18.4375C26.875 20.336 25.336 21.875 23.4375 21.875H3.4375C1.53902 21.875 0 20.336 0 18.4375V8.125H26.875V18.4375ZM10.9375 15C10.4197 15 10 15.4197 10 15.9375C10 16.4553 10.4197 16.875 10.9375 16.875H12.8125C13.3303 16.875 13.75 16.4553 13.75 15.9375C13.75 15.4197 13.3303 15 12.8125 15H10.9375ZM16.5625 15C16.0447 15 15.625 15.4197 15.625 15.9375C15.625 16.4553 16.0447 16.875 16.5625 16.875H20.9375C21.4553 16.875 21.875 16.4553 21.875 15.9375C21.875 15.4197 21.4553 15 20.9375 15H16.5625ZM23.4375 0C25.336 0 26.875 1.53902 26.875 3.4375V6.25H0V3.4375C0 1.53902 1.53902 0 3.4375 0H23.4375Z'
        fill='url(#paint0_linear_750_3344)'
      />
      <defs>
        <linearGradient
          id='paint0_linear_750_3344'
          x1='13.4375'
          y1='0'
          x2='13.4375'
          y2='21.875'
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#58A6FF' />
          <stop offset='1' stopColor='#3683DB' />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default BankCard;
