import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Tailwind,
  Link,
} from "@react-email/components";
import * as React from "react";

interface VendorWelcomeProps {
  username: string;
  password: string;
}

export const VendorWelcome = ({
  username = "<Username>",
  password = "<Password>",
}: VendorWelcomeProps) => (
  <Html>
    <Head />
    <Preview>Welcome to the Amrita Online Admission Portal (AOAP)</Preview>
    <Tailwind>
      <Body className="bg-white my-auto mx-auto font-sans">
        <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[600px]">
          <Img
            src="https://dt19wmazj2dns.cloudfront.net/wp-content/uploads/2023/10/logo-colored.svg"
            width="170"
            height="50"
            alt="Amrita Vishwa Vidyapeetham"
            className="mx-auto mb-6"
          />
          <Text className="mb-3 text-lg leading-5 text-gray-700 text-center font-bold">
            Directorate of Admissions
          </Text>
          <Text className="mb-3 text-sm leading-5 text-gray-700">
            Dear Vendor,
          </Text>
          <Section className="px-10">
            <Hr className="border-t border-b border-gray-300 my-5" />
            <Text className="text-sm leading-6 text-gray-700">
              We hope this message finds you well. Please find your login
              credentials below. Please Login at :{" "}
              <Link
                href="https://aee.amrita.edu/vendor"
                className="text-pink-800 underline"
              >
                Click here to Login
              </Link>
              <p className="text-sm leading-6 text-gray-700">
                Your username is : {username}
              </p>
              <p className="text-sm leading-6 text-gray-700">
                Your password is : {password}
              </p>
            </Text>
          </Section>

          <Text>
            Warm regards,
            <br /> <br />
            Director (Admissions) <br />
            Directorate of Admissions <br />
            Amrita Vishwa Vidyapeetham
          </Text>
          <Hr />
          <Text>© Amrita Vishwa Vidyapeetham</Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default VendorWelcome;
