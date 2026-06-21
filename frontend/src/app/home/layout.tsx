'use server'
 
 
import { cookies } from 'next/headers';
import Nav from './_components/layout/Nav'
import NavDialog from './_components/layout/NavDialog'
import OfflineIndicator from './_components/layout/OfflineIndicator'
import ToastMessages from '@/_components/ToastMessages'
import { redirect } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

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

    // NOTE: the lowstock badge count is fetched client-side inside <Nav> so a
    // slow/hung backend endpoint can never block server-side rendering of the
    // shared layout (which would take down every /home/* page). See Nav.tsx.

    return (
        <>
            {/* <Timeout></Timeout> */}
            <ToastMessages></ToastMessages>
            <OfflineIndicator />
            <div>
                {/* Static sidebar for desktop */}
                <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-62 lg:flex-col">
                    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6">
                        <Nav imageUrl={imageUrl} fullName={fullName} onSmallScreen={false} />
                    </div>
                </div>
                <NavDialog imageUrl={imageUrl} fullName={fullName} />
                {/* pb-20 reserves space for the mobile bottom tab bar */}
                <div className="pb-20 lg:pb-0">
                    {children}
                </div>
            </div>
        </>
    )
}
