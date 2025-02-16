import React from 'react';
import Header from './Header';

const Layout = ({ children }) => {
    return (
        <div className="layout">
            <Header/>
            <main style={{padding: '20px'}}>{children}</main>
        </div>
    );
};

export default Layout;
