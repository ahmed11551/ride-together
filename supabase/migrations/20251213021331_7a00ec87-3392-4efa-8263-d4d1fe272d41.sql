-- =============================================
-- Ride Together Database Schema
-- =============================================

-- Create enum types
CREATE TYPE public.ride_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'refunded');

-- =============================================
-- PROFILES TABLE (User profiles)
-- =============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    bio TEXT,
    rating NUMERIC(3,2) DEFAULT 5.0,
    trips_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- =============================================
-- DRIVER INFO TABLE
-- =============================================
CREATE TABLE public.driver_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    car_model TEXT NOT NULL,
    car_color TEXT,
    car_photo_url TEXT,
    license_plate TEXT,
    license_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.driver_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Driver info is viewable by everyone"
ON public.driver_info FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own driver info"
ON public.driver_info FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own driver info"
ON public.driver_info FOR UPDATE
USING (auth.uid() = user_id);

-- =============================================
-- RIDES TABLE
-- =============================================
CREATE TABLE public.rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    from_city TEXT NOT NULL,
    from_address TEXT NOT NULL,
    to_city TEXT NOT NULL,
    to_address TEXT NOT NULL,
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    estimated_duration TEXT,
    price INTEGER NOT NULL,
    seats_total INTEGER NOT NULL DEFAULT 4,
    seats_available INTEGER NOT NULL DEFAULT 4,
    status public.ride_status DEFAULT 'active',
    allow_smoking BOOLEAN DEFAULT false,
    allow_pets BOOLEAN DEFAULT false,
    allow_music BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rides are viewable by everyone"
ON public.rides FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create rides"
ON public.rides FOR INSERT
WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their own rides"
ON public.rides FOR UPDATE
USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can delete their own rides"
ON public.rides FOR DELETE
USING (auth.uid() = driver_id);

-- =============================================
-- BOOKINGS TABLE
-- =============================================
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
    passenger_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    seats_booked INTEGER NOT NULL DEFAULT 1,
    status public.booking_status DEFAULT 'pending',
    payment_status public.payment_status DEFAULT 'pending',
    total_price INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(ride_id, passenger_id)
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookings"
ON public.bookings FOR SELECT
USING (
    auth.uid() = passenger_id OR 
    auth.uid() IN (SELECT driver_id FROM public.rides WHERE id = ride_id)
);

CREATE POLICY "Authenticated users can create bookings"
ON public.bookings FOR INSERT
WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Users can update their own bookings"
ON public.bookings FOR UPDATE
USING (auth.uid() = passenger_id OR auth.uid() IN (SELECT driver_id FROM public.rides WHERE id = ride_id));

-- =============================================
-- REVIEWS TABLE
-- =============================================
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
    from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(ride_id, from_user_id, to_user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
ON public.reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews for their rides"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

-- =============================================
-- MESSAGES TABLE (for ride chats)
-- =============================================
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ride participants can view messages"
ON public.messages FOR SELECT
USING (
    auth.uid() IN (SELECT driver_id FROM public.rides WHERE id = ride_id) OR
    auth.uid() IN (SELECT passenger_id FROM public.bookings WHERE ride_id = messages.ride_id)
);

CREATE POLICY "Ride participants can send messages"
ON public.messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id AND (
        auth.uid() IN (SELECT driver_id FROM public.rides WHERE id = ride_id) OR
        auth.uid() IN (SELECT passenger_id FROM public.bookings WHERE ride_id = messages.ride_id)
    )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_info_updated_at
    BEFORE UPDATE ON public.driver_info
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rides_updated_at
    BEFORE UPDATE ON public.rides
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update seats_available when booking is made
CREATE OR REPLACE FUNCTION public.update_seats_on_booking()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.rides 
        SET seats_available = seats_available - NEW.seats_booked
        WHERE id = NEW.ride_id;
    ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status != 'cancelled') THEN
        UPDATE public.rides 
        SET seats_available = seats_available + COALESCE(OLD.seats_booked, NEW.seats_booked)
        WHERE id = COALESCE(OLD.ride_id, NEW.ride_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_booking_change
    AFTER INSERT OR UPDATE OR DELETE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.update_seats_on_booking();

-- Indexes for performance
CREATE INDEX idx_rides_departure ON public.rides(departure_date, departure_time);
CREATE INDEX idx_rides_from_to ON public.rides(from_city, to_city);
CREATE INDEX idx_rides_status ON public.rides(status);
CREATE INDEX idx_bookings_passenger ON public.bookings(passenger_id);
CREATE INDEX idx_bookings_ride ON public.bookings(ride_id);
CREATE INDEX idx_messages_ride ON public.messages(ride_id);