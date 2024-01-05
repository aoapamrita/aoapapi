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

export const SlotBlukInform = ({ name = "<Name>" }: CandidateWelcomeProps) => (
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
              Greetings from Directorate of Admissions!
            </Text>

            <Text className="text-sm leading-6 text-gray-700">
              This is to inform you that the Phase – I of AEEE 2024 will be
              conducted as published in the web site – January 16 – 22, 2024.
            </Text>
            <Text className="text-sm leading-6 text-gray-700">
              You are required to book your slot for the same, from January 5,
              2024 at 10 AM.
            </Text>
            <Text className="text-sm leading-6 text-gray-700">
              The link to book the slot for Phase 1 of AEEE 2024 will be
              published in your dashboard of the Application portal
              <Link
                href="https://aee.amrita.edu"
                className="text-pink-800 underline"
              >
                (aee.amrita.edu)
              </Link>
              from the above mentioned date. You may click on the link and book
              your preferred slots.
            </Text>
            <Text className="text-sm leading-6 text-gray-700">
              You are advised to book your preferred slots as soon as the link
              is published, to avoid disappointment / non-availability of your
              preferred slots as you will be able to book only the slots
              available at the time of your logging in.
            </Text>
            <Text className="text-sm leading-6 text-gray-700">
              It may also be noted that those who are not booking the slot
              within the time frame will not be able to appear for Phase – I of
              AEEE 2024. No requests in this regard will be entertained later.
            </Text>
            <Text className="text-sm leading-6 text-gray-700">
              Should you have any queries, contact us at{" "}
              <Link
                href="mailto:btech@amrita.edu"
                className="text-pink-800 underline"
              >
                btech@amrita.edu
              </Link>{" "}
              / Call:044-462 76066
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

export default SlotBlukInform;
