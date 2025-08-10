import React from 'react';
import Head from 'next/head';
import RoleSelection from '../components/RoleSelection';

const RoleSelectionPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Create or Join League - ClutchPicks</title>
        <meta name="description" content="Create a new league or join an existing one" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <RoleSelection />
    </>
  );
};

export default RoleSelectionPage; 