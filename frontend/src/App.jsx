import { useEffect } from 'react';
import axios from 'axios';
import ExcelUploader from './components/ExcelUploader';
import Navbar from './components/Navbar';
import { Box, Flex } from '@chakra-ui/react';

function App() {


  return (
    <Box bg={"blue.100"} height={"100vh"}>
    <Navbar/>
      <ExcelUploader />
    </Box>
  );
}

export default App;
