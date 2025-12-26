export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className='flex min-h-screen items-center justify-center bg-gray-100 px-4 py-8'
      style={{
        backgroundImage: 'url(/gridline.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className='w-full'>{children}</div>
    </div>
  );
}
