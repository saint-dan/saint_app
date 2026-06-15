import React from 'react';
import { Html, Head, Body, Container, Text, Section, Link } from '@react-email/components';
import { GLOBAL_EMAIL_SIGNATURE } from './emailConfig';

interface InviteUserEmailProps {
  firstName: string;
  actionLink: string;
}

export default function InviteUserEmail({
  firstName,
  actionLink,
}: InviteUserEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={title}>Invitation to the Saint App</Text>
          </Section>
          
          <Section style={body}>
            <Text style={text}>Hi {firstName},</Text>
            <Text style={text}>You have been invited to join the Saint App.</Text>
            <Text style={text}>
              Please click the button below to accept your invitation and set up your password.
            </Text>
            <Section style={buttonContainer}>
              <Link href={actionLink} style={button}>Accept Invitation</Link>
            </Section>
            <br />
            <div dangerouslySetInnerHTML={{ __html: GLOBAL_EMAIL_SIGNATURE }} />
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: '#f8fafc', padding: '40px 0', fontFamily: 'Helvetica, Arial, sans-serif' };
const container = { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', margin: '0 auto', padding: '30px', maxWidth: '600px' };
const header = { borderBottom: '2px solid #2563eb', paddingBottom: '15px', marginBottom: '20px' };
const title = { fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a', margin: '0' };
const body = { padding: '10px 0' };
const text = { fontSize: '16px', color: '#334155', lineHeight: '1.6', marginBottom: '15px' };
const buttonContainer = { textAlign: 'center' as const, margin: '25px 0' };
const button = { backgroundColor: '#2563eb', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '12px 24px' };