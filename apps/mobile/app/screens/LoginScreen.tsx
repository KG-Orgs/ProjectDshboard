import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import { useAuthStore } from '@contractor/shared';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login(email, password);
      // Navigation will be handled by the auth state change
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text variant="displayMedium" style={styles.title}>
          Contractor
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Project Management Suite
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.formTitle}>
              Sign In
            </Text>
            {/* Form fields would go here with React Native Paper TextInput */}
            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Sign In
            </Button>
            <Button
              mode="text"
              onPress={() => navigation.navigate('SignUp')}
              style={styles.button}
            >
              Don't have an account? Sign Up
            </Button>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  card: {
    marginTop: 20,
  },
  formTitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
  },
});
