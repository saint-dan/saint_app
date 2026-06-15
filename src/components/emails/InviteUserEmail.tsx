import React from 'react';
import { Html, Head, Body, Container, Text, Section, Link } from '@react-email/components';
import { GLOBAL_EMAIL_SIGNATURE } from './emailConfig';

interface InviteUserEmailProps {
  firstName: string;
  email: string;
  tempPassword: string;
  appUrl: string;
}

export default function InviteUserEmail({
  firstName,
  email,
  tempPassword,
  appUrl,
}: InviteUserEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={title}>Your Invitation to the Saint Group App</Text>
          </Section>
          
          <Section style={body}>
            <Text style={text}>Hi {firstName},</Text>
            <Text style={text}>You have been invited to join the Saint Group App.</Text>
            <Text style={text}>
              You can log in at <Link href={appUrl} style={link}>{appUrl}</Link> using your email and the following password:
            </Text>
            <ul style={list}>
              <li><strong>Temporary Password:</strong> {tempPassword}</li>
            </ul>
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
const list = { fontSize: '16px', color: '#334155', lineHeight: '1.6', marginBottom: '15px', paddingLeft: '20px' };
const link = { color: '#2563eb', textDecoration: 'none' };