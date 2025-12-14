import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RideCard from '../rides/RideCard';

describe('RideCard', () => {
  const mockRide = {
    id: 'test-ride-id',
    driver: {
      name: 'Иван Иванов',
      avatar: 'https://example.com/avatar.jpg',
      rating: 4.5,
      trips: 10,
      verified: true,
    },
    from: 'Москва, м. Бауманская',
    to: 'Санкт-Петербург, м. Московская',
    fromCity: 'Москва',
    toCity: 'Санкт-Петербург',
    date: '2025-02-01',
    time: '10:00',
    duration: '7 ч',
    price: 1500,
    seats: 2,
    features: {
      noSmoking: true,
      music: true,
      pets: false,
    },
  };

  it('should render ride information', () => {
    render(<RideCard ride={mockRide} />);
    
    expect(screen.getByText('Москва')).toBeInTheDocument();
    expect(screen.getByText('Санкт-Петербург')).toBeInTheDocument();
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
  });

  it('should display price correctly', () => {
    render(<RideCard ride={mockRide} />);
    
    // toLocaleString() formats based on locale - could be "1,500" or "1 500" or "1500"
    // Check that price is displayed (contains 1500 in some format)
    const priceText = screen.getByText(/1500|1[, ]500/i);
    expect(priceText).toBeInTheDocument();
  });

  it('should display driver verification badge', () => {
    render(<RideCard ride={mockRide} />);
    
    expect(screen.getByText('Проверен')).toBeInTheDocument();
  });
});

