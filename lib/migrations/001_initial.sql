CREATE TABLE IF NOT EXISTS installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whop_company_id TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'pro_plus')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whop_company_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courses_company ON courses(whop_company_id);

CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  whop_lesson_id TEXT,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  unlock_rule TEXT NOT NULL DEFAULT 'always' CHECK (unlock_rule IN ('previous_quiz_passed', 'date', 'always')),
  unlock_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_modules_course ON modules(course_id);

CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  pass_threshold_pct NUMERIC(5,2) NOT NULL DEFAULT 80.00,
  max_attempts INTEGER,
  time_limit_seconds INTEGER,
  randomize_order BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quizzes_module ON quizzes(module_id);

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'multi_select', 'short_text')),
  prompt TEXT NOT NULL,
  options JSONB,
  correct_answer JSONB NOT NULL,
  tags TEXT[] DEFAULT '{}',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_questions_quiz ON questions(quiz_id);
CREATE INDEX idx_questions_course ON questions(course_id);

CREATE TABLE IF NOT EXISTS attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  whop_user_id TEXT NOT NULL,
  score_pct NUMERIC(5,2),
  passed BOOLEAN NOT NULL DEFAULT false,
  answers JSONB NOT NULL DEFAULT '[]',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ
);

CREATE INDEX idx_attempts_quiz ON attempts(quiz_id);
CREATE INDEX idx_attempts_user ON attempts(whop_user_id);

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  whop_user_id TEXT NOT NULL,
  verification_code TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pdf_url TEXT,
  student_display_name TEXT NOT NULL
);

CREATE INDEX idx_certificates_verification ON certificates(verification_code);
CREATE INDEX idx_certificates_course_user ON certificates(course_id, whop_user_id);

CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  whop_user_id TEXT NOT NULL,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'unlocked', 'completed')),
  completed_at TIMESTAMPTZ,
  UNIQUE(course_id, whop_user_id, module_id)
);

CREATE INDEX idx_progress_course_user ON student_progress(course_id, whop_user_id);
