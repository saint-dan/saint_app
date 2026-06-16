import React from 'react';
import { Html, Head, Body, Container, Text, Section, } from '@react-email/components';
import { GLOBAL_EMAIL_SIGNATURE } from './emailConfig';

interface InspectionReportEmailProps {
  inspectorName: string;
  siteName: string;
  date: string;
}

export default function InspectionReportEmail({ 
  inspectorName, 
  siteName, 
  date 
}: InspectionReportEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={title}>Site Inspection Report</Text>
          </Section>
          
          <Section style={body}>
            <Text style={text}>Hello,</Text>
            <Text style={text}>
              Please find attached the completed Site Inspection Report for <strong>{siteName}</strong>, 
              conducted by {inspectorName} on {date}.
            </Text>
            <div dangerouslySetInnerHTML={{ __html: GLOBAL_EMAIL_SIGNATURE }} />
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles for the email (React Email uses inline styles)
const main = { backgroundColor: '#f8fafc', padding: '40px 0', fontFamily: 'Helvetica, Arial, sans-serif' };
const container = { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', margin: '0 auto', padding: '30px', maxWidth: '600px' };
const header = { borderBottom: '2px solid #2563eb', paddingBottom: '15px', marginBottom: '20px' };
const title = { fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a', margin: '0' };
const body = { padding: '10px 0' };
const text = { fontSize: '16px', color: '#334155', lineHeight: '1.6', marginBottom: '15px' };