-- Add CHECK constraints for numeric validation

-- Quotes table constraints
ALTER TABLE quotes
  ADD CONSTRAINT quotes_subtotal_positive CHECK (subtotal >= 0),
  ADD CONSTRAINT quotes_total_positive CHECK (total >= 0),
  ADD CONSTRAINT quotes_discount_valid CHECK (discount IS NULL OR (discount >= 0 AND discount <= subtotal)),
  ADD CONSTRAINT quotes_tax_positive CHECK (tax IS NULL OR tax >= 0);

-- Quote items table constraints
ALTER TABLE quote_items
  ADD CONSTRAINT quote_items_quantity_positive CHECK (quantity > 0),
  ADD CONSTRAINT quote_items_unit_price_non_negative CHECK (unit_price >= 0),
  ADD CONSTRAINT quote_items_total_price_non_negative CHECK (total_price >= 0);

-- Orders table constraints
ALTER TABLE orders
  ADD CONSTRAINT orders_subtotal_positive CHECK (subtotal >= 0),
  ADD CONSTRAINT orders_total_positive CHECK (total >= 0),
  ADD CONSTRAINT orders_discount_valid CHECK (discount IS NULL OR discount >= 0),
  ADD CONSTRAINT orders_tax_positive CHECK (tax IS NULL OR tax >= 0);

-- Order items table constraints
ALTER TABLE order_items
  ADD CONSTRAINT order_items_quantity_positive CHECK (quantity > 0),
  ADD CONSTRAINT order_items_unit_price_non_negative CHECK (unit_price >= 0),
  ADD CONSTRAINT order_items_total_price_non_negative CHECK (total_price >= 0);

-- Products table constraints
ALTER TABLE products
  ADD CONSTRAINT products_price_non_negative CHECK (price >= 0),
  ADD CONSTRAINT products_stock_qty_non_negative CHECK (stock_qty IS NULL OR stock_qty >= 0);

-- Email format validation using simpler pattern (requires @ and . after @)
ALTER TABLE leads
  ADD CONSTRAINT leads_email_format 
  CHECK (customer_email IS NULL OR customer_email = '' OR customer_email ~* '^.+@.+\..+$');

ALTER TABLE customers
  ADD CONSTRAINT customers_email_format 
  CHECK (email IS NULL OR email = '' OR email ~* '^.+@.+\..+$');

-- Validation trigger for quote calculations
CREATE OR REPLACE FUNCTION validate_quote_calculations()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate discount doesn't exceed subtotal
  IF COALESCE(NEW.discount, 0) > NEW.subtotal THEN
    RAISE EXCEPTION 'Discount cannot exceed subtotal';
  END IF;
  
  -- Validate total calculation (allow small floating point differences)
  IF ABS(NEW.total - (NEW.subtotal - COALESCE(NEW.discount, 0) + COALESCE(NEW.tax, 0))) > 0.01 THEN
    RAISE EXCEPTION 'Total calculation is incorrect';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER check_quote_calculations
  BEFORE INSERT OR UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION validate_quote_calculations();

-- Validation trigger for order calculations
CREATE OR REPLACE FUNCTION validate_order_calculations()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate discount doesn't exceed subtotal
  IF COALESCE(NEW.discount, 0) > NEW.subtotal THEN
    RAISE EXCEPTION 'Discount cannot exceed subtotal';
  END IF;
  
  -- Validate total calculation (allow small floating point differences)
  IF ABS(NEW.total - (NEW.subtotal - COALESCE(NEW.discount, 0) + COALESCE(NEW.tax, 0))) > 0.01 THEN
    RAISE EXCEPTION 'Total calculation is incorrect';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER check_order_calculations
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_calculations();

-- Validation trigger for line item calculations (used by both quote_items and order_items)
CREATE OR REPLACE FUNCTION validate_line_item_calculations()
RETURNS TRIGGER AS $$
BEGIN
  -- Verify total_price = quantity * unit_price (with tolerance)
  IF ABS(NEW.total_price - (NEW.quantity * NEW.unit_price)) > 0.01 THEN
    RAISE EXCEPTION 'Line item total does not match quantity × unit price';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER check_quote_item_calculations
  BEFORE INSERT OR UPDATE ON quote_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_line_item_calculations();

CREATE TRIGGER check_order_item_calculations
  BEFORE INSERT OR UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_line_item_calculations();