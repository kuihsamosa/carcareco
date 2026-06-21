'use server'
 
 
import { cookies } from 'next/headers';
import Nav from './_components/layout/Nav'
import NavDialog from './_components/layout/NavDialog'
import OfflineIndicator from './_components/layout/OfflineIndicator'
import ToastMessages from '@/_components/ToastMessages'
import { redirect } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { getJwt } from '@/_lib/server/session';

interface CustomJwtPayload {
    FullName?: string; 
  }
export default async function Layout({ children }: { children: React.ReactNode }) {
    
    const jwt = (await cookies()).get('jwt')?.value;
    
    if(!jwt) {
        redirect('/home/logout'); 
    }
    
    // Decode the JWT to get the claims
    const decodedToken = jwtDecode<CustomJwtPayload>(jwt);
    const fullName = decodedToken.FullName || ''; // Extract the FullName claim
    
    // If there's no full name in the token, you might want to redirect or handle it
    if(!fullName) {
        redirect('/home/logout');
    }

    const imageUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/users/profilepicture/${jwt}`

    // The lowstock badge must NEVER block the shared layout. Next.js's patched
    // fetch ignores AbortController, so race the request against a hard timer:
    // if the backend endpoint hangs, we stop awaiting it and render with 0.
    let lowStockCount = 0;
    try {
        const apiJwt = await getJwt();
        const fetchCount = fetch(`${process.env.API_URL}/api/spareparts/lowstock/count`, {
            headers: { Authorization: `Bearer ${apiJwt}` },
            cache: 'no-store',
        })
            .then((r) => (r.ok ? r.json() : 0))
            .catch(() => 0);
        const timeout = new Promise<number>((resolve) => setTimeout(() => resolve(0), 2500));
        lowStockCount = (await Promise.race([fetchCount, timeout])) || 0;
    } catch { /* non-fatal — show 0 */ }

    return (
        <>
            {/* <Timeout></Timeout> */}
            <ToastMessages></ToastMessages>
            <OfflineIndicator />
            <div>
                {/* Static sidebar for desktop */}
                <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-62 lg:flex-col">
                    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6">
                        <Nav imageUrl={imageUrl} fullName={fullName} onSmallScreen={false} lowStockCount={lowStockCount} />
                    </div>
                </div>
                <NavDialog imageUrl={imageUrl} fullName={fullName} lowStockCount={lowStockCount} />
                {/* pb-20 reserves space for the mobile bottom tab bar */}
                <div className="pb-20 lg:pb-0">
                    {children}
                </div>
            </div>
        </>
    )
}
