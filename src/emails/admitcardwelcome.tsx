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

interface CandidateWelcomeProps {
  name: string;
}

export const AdmitCardWelcome = ({
  name = "<Name>",
}: CandidateWelcomeProps) => (
  <Html>
    <Head />
    <Preview>
      Welcome to the Amrita Entrance Examination - Engineering 2024
    </Preview>
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
            Dear {name},
          </Text>
          <Section className="px-10">
            <Hr className="border-t border-b border-gray-300 my-5" />
            <Text className="text-sm leading-6 text-gray-700">
              We are pleased to inform you that the admit card for the upcoming
              AEEE Phase 1 has been released. You can now download and print
              your admit card from the{" "}
              <Link
                href="https://aoap.heptest.xyz"
                className="text-pink-800 underline"
              >
                Application Portal
              </Link>
              . In case you face any issues while downloading or printing the
              admit card, please contact{" "}
              <Link
                href="mailto:btech@amrita.edu"
                className="text-pink-800 underline"
              >
                btech@amrita.edu
              </Link>{" "}
              immediately for assistance. We wish you all the best for the exam
              and hope that you perform well.
            </Text>
            <Text className="text-sm leading-6 text-gray-700">
              Please ensure that you carefully read and follow the instructions
              mentioned on the admit card. It is important that you carry the
              admit card with you on the day of the exam, as it serves as your
              entry pass to the examination hall.
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

export default AdmitCardWelcome;
