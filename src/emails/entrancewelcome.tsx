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

export const EntranceWelcome = ({ name = "<Name>" }: CandidateWelcomeProps) => (
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
              We are thrilled to welcome you to Amrita, and we extend our
              heartfelt congratulations for successfully completing the
              registration process. Your decision to embark on this journey is
              an exciting step towards a world-class education, and we are
              honoured to have you as a part of the Amrita family.
            </Text>
            <Text className="text-sm leading-6 text-gray-700">
              Amrita University, often recognised for its unwavering commitment
              to academic excellence, innovation, and holistic development,
              offers a unique set of USPs (Unique Selling Points) that sets it
              apart:
            </Text>
            <Text className="text-sm leading-6 text-gray-700">
              <span className="font-bold">Academic Excellence:</span> At Amrita,
              we're dedicated to fostering academic excellence. Our
              distinguished faculty, state-of-the-art facilities, and rigorous
              curriculum ensure that you receive a world-class education.
            </Text>
            <Text className="text-sm leading-6 text-gray-700">
              <span className="font-bold">Research and Innovation: </span>{" "}
              Amrita is a hub of innovation and research. Our university is
              known for pioneering breakthroughs in various fields, making it a
              place where knowledge is created and applied to address real-world
              challenges.
            </Text>
            <Text className="text-sm leading-6 text-gray-700">
              <span className="font-bold">Global Perspective: </span> We believe
              in preparing students for a globalised world. With international
              collaborations and global exposure, Amrita equips you to thrive in
              an interconnected and diverse society.
            </Text>
            <Text className="text-sm leading-6 text-gray-700">
              <span className="font-bold">Holistic Development: </span> Beyond
              academics, Amrita places a strong emphasis on your personal and
              professional growth. We offer a range of extracurricular
              activities, clubs, and opportunities to develop your leadership
              and interpersonal skills.
            </Text>
            <Text className="text-sm leading-6 text-gray-700">
              <span className="font-bold">Value based Education: </span> Amrita
              University stands on a foundation of ethical and humanitarian
              values. Our emphasis on ethics and social responsibility guides
              our students to become compassionate and responsible citizens.
            </Text>
            <Text className="text-sm leading-6 text-gray-700">
              Now that you've completed your registration, please keep an eye on
              your email for further updates and instructions regarding the
              examination date, venue, and any additional information you may
              need. If you have any questions or require assistance at any point
              in this process, our dedicated support team is here to help.You
              can reach them at{" "}
              <Link
                href="mailto:aeee@amrita.edu"
                className="text-pink-800 underline"
              >
                aeee@amrita.edu
              </Link>{" "}
              or call our helpline at{" "}
              <span className="font-bold">044-462 76066</span>.
            </Text>
            <Text className="text-sm leading-6 text-gray-700">
              We wish you the best of luck in your preparations for the Amrita
              Entrance Examination - Engineering 2024. We're confident that your
              journey with Amrita will be one of growth, knowledge, and
              countless opportunities.
            </Text>
            <Text className="text-sm leading-6 text-gray-700">
              Welcome to a world of possibilities. We look forward to meeting
              you in person.
            </Text>
              <Text className="text-sm leading-6 text-gray-700">
                To check your application status and profile, visit: {""}
                <Link
                  href="https://aee.amrita.edu/"
                  className="text-pink-800 underline"
                >
                  Amrita Online Application Portal (AOAP) managed by Directorate of Admissions.
                </Link>
              </Text>
              <Text className="text-sm leading-6 text-gray-700">
                Join our official Telegram Channel for latest updates: {""}
                <Link
                  href="https://t.me/amritabtech"
                  className="text-pink-800 underline"
                > 
                  AEEE2024
                </Link>
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

export default EntranceWelcome;
