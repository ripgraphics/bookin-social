-- =====================================================
-- AMENITIES SYSTEM MIGRATION
-- =====================================================
-- This migration creates the amenities management system
-- with categories, amenities, and listing associations.
-- =====================================================

-- =====================================================
-- 1. CREATE TABLES
-- =====================================================

-- Create amenity_categories table
CREATE TABLE IF NOT EXISTS public.amenity_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    icon text,
    display_order int NOT NULL DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create amenities table
CREATE TABLE IF NOT EXISTS public.amenities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid NOT NULL,
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    icon text NOT NULL,
    is_essential boolean DEFAULT false,
    is_active boolean DEFAULT true,
    display_order int NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT fk_amenity_category 
        FOREIGN KEY (category_id) 
        REFERENCES public.amenity_categories(id) 
        ON DELETE CASCADE
);

-- Create listing_amenities junction table (many-to-many)
CREATE TABLE IF NOT EXISTS public.listing_amenities (
    listing_id uuid NOT NULL,
    amenity_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (listing_id, amenity_id),
    CONSTRAINT fk_listing 
        FOREIGN KEY (listing_id) 
        REFERENCES public.listings(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_amenity 
        FOREIGN KEY (amenity_id) 
        REFERENCES public.amenities(id) 
        ON DELETE CASCADE
);

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================

-- Indexes for amenity_categories
CREATE INDEX IF NOT EXISTS idx_amenity_categories_slug 
    ON public.amenity_categories(slug);
CREATE INDEX IF NOT EXISTS idx_amenity_categories_active 
    ON public.amenity_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_amenity_categories_order 
    ON public.amenity_categories(display_order);

-- Indexes for amenities
CREATE INDEX IF NOT EXISTS idx_amenities_category 
    ON public.amenities(category_id);
CREATE INDEX IF NOT EXISTS idx_amenities_slug 
    ON public.amenities(slug);
CREATE INDEX IF NOT EXISTS idx_amenities_active 
    ON public.amenities(is_active);
CREATE INDEX IF NOT EXISTS idx_amenities_essential 
    ON public.amenities(is_essential);
CREATE INDEX IF NOT EXISTS idx_amenities_order 
    ON public.amenities(display_order);

-- Indexes for listing_amenities
CREATE INDEX IF NOT EXISTS idx_listing_amenities_listing 
    ON public.listing_amenities(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_amenities_amenity 
    ON public.listing_amenities(amenity_id);

-- =====================================================
-- 3. CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Trigger for amenity_categories
CREATE OR REPLACE FUNCTION update_amenity_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_amenity_categories_updated_at
    BEFORE UPDATE ON public.amenity_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_amenity_categories_updated_at();

-- Trigger for amenities
CREATE OR REPLACE FUNCTION update_amenities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_amenities_updated_at
    BEFORE UPDATE ON public.amenities
    FOR EACH ROW
    EXECUTE FUNCTION update_amenities_updated_at();

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.amenity_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_amenities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE RLS POLICIES
-- =====================================================

-- ============ AMENITY_CATEGORIES POLICIES ============

-- Public can view active categories
CREATE POLICY "Anyone can view active amenity categories"
    ON public.amenity_categories
    FOR SELECT
    USING (is_active = true);

-- Admins can view all categories
CREATE POLICY "Admins can view all amenity categories"
    ON public.amenity_categories
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('super_admin', 'admin')
        )
    );

-- Admins can insert categories
CREATE POLICY "Admins can insert amenity categories"
    ON public.amenity_categories
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('super_admin', 'admin')
        )
    );

-- Admins can update categories
CREATE POLICY "Admins can update amenity categories"
    ON public.amenity_categories
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('super_admin', 'admin')
        )
    );

-- Admins can delete categories
CREATE POLICY "Admins can delete amenity categories"
    ON public.amenity_categories
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('super_admin', 'admin')
        )
    );

-- ============ AMENITIES POLICIES ============

-- Public can view active amenities
CREATE POLICY "Anyone can view active amenities"
    ON public.amenities
    FOR SELECT
    USING (is_active = true);

-- Admins can view all amenities
CREATE POLICY "Admins can view all amenities"
    ON public.amenities
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('super_admin', 'admin')
        )
    );

-- Admins can insert amenities
CREATE POLICY "Admins can insert amenities"
    ON public.amenities
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('super_admin', 'admin')
        )
    );

-- Admins can update amenities
CREATE POLICY "Admins can update amenities"
    ON public.amenities
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('super_admin', 'admin')
        )
    );

-- Admins can delete amenities
CREATE POLICY "Admins can delete amenities"
    ON public.amenities
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('super_admin', 'admin')
        )
    );

-- ============ LISTING_AMENITIES POLICIES ============

-- Anyone can view listing amenities
CREATE POLICY "Anyone can view listing amenities"
    ON public.listing_amenities
    FOR SELECT
    USING (true);

-- Listing owners can manage their listing amenities
CREATE POLICY "Listing owners can manage their amenities"
    ON public.listing_amenities
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.listings l
            JOIN public.users u ON l.user_id = u.id
            WHERE l.id = listing_amenities.listing_id
            AND u.auth_user_id = auth.uid()
        )
    );

-- Admins can manage all listing amenities
CREATE POLICY "Admins can manage all listing amenities"
    ON public.listing_amenities
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('super_admin', 'admin')
        )
    );

-- =====================================================
-- 6. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get amenities by category
CREATE OR REPLACE FUNCTION get_amenities_by_category(category_slug text)
RETURNS TABLE (
    id uuid,
    category_id uuid,
    name text,
    slug text,
    description text,
    icon text,
    is_essential boolean,
    is_active boolean,
    display_order int
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.category_id,
        a.name,
        a.slug,
        a.description,
        a.icon,
        a.is_essential,
        a.is_active,
        a.display_order
    FROM public.amenities a
    JOIN public.amenity_categories ac ON a.category_id = ac.id
    WHERE ac.slug = category_slug
    AND a.is_active = true
    ORDER BY a.display_order, a.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get listing amenities with details
CREATE OR REPLACE FUNCTION get_listing_amenities_with_details(p_listing_id uuid)
RETURNS TABLE (
    amenity_id uuid,
    amenity_name text,
    amenity_slug text,
    amenity_description text,
    amenity_icon text,
    is_essential boolean,
    category_id uuid,
    category_name text,
    category_slug text,
    category_icon text,
    display_order int
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as amenity_id,
        a.name as amenity_name,
        a.slug as amenity_slug,
        a.description as amenity_description,
        a.icon as amenity_icon,
        a.is_essential,
        ac.id as category_id,
        ac.name as category_name,
        ac.slug as category_slug,
        ac.icon as category_icon,
        a.display_order
    FROM public.listing_amenities la
    JOIN public.amenities a ON la.amenity_id = a.id
    JOIN public.amenity_categories ac ON a.category_id = ac.id
    WHERE la.listing_id = p_listing_id
    AND a.is_active = true
    AND ac.is_active = true
    ORDER BY ac.display_order, a.display_order, a.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

