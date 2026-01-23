import React from 'react';
import { Box, Flex, Heading, Spacer, Link, HStack, Text } from '@chakra-ui/react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

function Navbar() {
  return (
    <Box bg="blue.900" px={6} py={4} boxShadow="md" mb={6}>
      <Flex align="center" color="white">
        <Heading size="md">Decline Curve Analysis</Heading>
        <Spacer />
        <HStack spacing={4}>
          <Text fontWeight="bold" >Sanyog Dongre</Text>
          <Link href="https://github.com/SanyogDg/Field_Decline-Curve-Analysis" isExternal target='blank'>
            <FaGithub size="20px" color="white" />
          </Link>
          <Link href="https://www.linkedin.com/in/sanyogdongre" isExternal target='blank'>
            <FaLinkedin size="20px" color="white" />
          </Link>
        </HStack>
      </Flex>
    </Box>
  );
}

export default Navbar;
