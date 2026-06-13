"""create_submissions_table

Revision ID: 4f8a2e3d1b7c
Revises: 79b2475ab7c9
Create Date: 2026-06-13 17:12:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = '4f8a2e3d1b7c'
down_revision: Union[str, None] = '79b2475ab7c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands for Submission Management System ###
    op.create_table('submissions',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('exam_id', UUID(as_uuid=True), nullable=False),
        sa.Column('student_name', sa.String(length=200), nullable=False),
        sa.Column('student_roll_number', sa.String(length=50), nullable=False),
        sa.Column('answer_sheet_path', sa.String(), nullable=True),
        sa.Column('ocr_output_path', sa.String(), nullable=True),
        sa.Column('evaluation_output_path', sa.String(), nullable=True),
        sa.Column('report_path', sa.String(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='UPLOADED'),
        sa.Column('ocr_status', sa.String(length=30), nullable=True),
        sa.Column('evaluation_status', sa.String(length=30), nullable=True),
        sa.Column('obtained_marks', sa.Float(), nullable=True),
        sa.Column('total_marks', sa.Float(), nullable=True),
        sa.Column('ocr_confidence', sa.Float(), nullable=True),
        sa.Column('evaluation_confidence', sa.Float(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['exam_id'], ['exams.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_submissions_id'), 'submissions', ['id'], unique=False)
    op.create_index(op.f('ix_submissions_exam_id'), 'submissions', ['exam_id'], unique=False)
    op.create_index(op.f('ix_submissions_student_roll_number'), 'submissions', ['student_roll_number'], unique=False)
    op.create_index(op.f('ix_submissions_status'), 'submissions', ['status'], unique=False)
    # ### end commands ###


def downgrade() -> None:
    # ### commands for Submission Management System ###
    op.drop_index(op.f('ix_submissions_status'), table_name='submissions')
    op.drop_index(op.f('ix_submissions_student_roll_number'), table_name='submissions')
    op.drop_index(op.f('ix_submissions_exam_id'), table_name='submissions')
    op.drop_index(op.f('ix_submissions_id'), table_name='submissions')
    op.drop_table('submissions')
    # ### end commands ###
