import FooterComponent from '@/elements/FooterCompnent';
import NavigationComponent from '@/elements/NavigationComponent';

interface BasicLayoutProps {
    children: React.ReactNode;
}
const BasicLayout: React.FC<BasicLayoutProps> = ({ children }) => {
    return (
        <div className='flex min-h-screen flex-col'>
            <NavigationComponent />
            <main className='mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-24'>{children}</main>
            <FooterComponent />
        </div>
    );
};
export default BasicLayout;
