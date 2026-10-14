import './globals.css';
export const metadata={title:'freshfresh — Good food. Less effort.',description:'Plan familiar meals around your budget, time and real life. Get a practical grocery list and make your week a little easier.',manifest:'/manifest.webmanifest'};
export const viewport={width:'device-width',initialScale:1,themeColor:'#f8f8f2'};
export default function RootLayout({children}){return <html lang="en"><body>{children}</body></html>;}
