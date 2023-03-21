import React, {useEffect} from 'react';
import Layout from '@theme-original/Layout';


export default function LayoutWrapper(props) {
  useEffect(() => {
    document.getElementsByTagName("html")[0].style.overflowX = "hidden";
  });
  return (
    <>
      <Layout {...props} />
    </>
  );
}
