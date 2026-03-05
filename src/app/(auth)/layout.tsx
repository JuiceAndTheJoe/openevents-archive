export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#c0d0e8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl">
        {children}
      </div>
    </div>
  )
}
