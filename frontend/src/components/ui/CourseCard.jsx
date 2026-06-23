import { Clock, Zap, Users, Star, ChevronRight } from 'lucide-react';
import Badge from './Badge';

export default function CourseCard({
  id,
  title = 'Course Title',
  description = 'Learn the fundamentals',
  thumbnail = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=250&fit=crop',
  duration = '4 weeks',
  difficulty = 'Intermediate',
  students = '2.5K',
  rating = 4.8,
  skills = ['Cloud', 'DevOps'],
  featured = false,
  onClick,
  className = '',
}) {
  const difficultyColors = {
    Beginner: 'bg-green-100 text-green-800 border-green-200',
    Intermediate: 'bg-amber-100 text-amber-800 border-amber-200',
    Advanced: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <button
      onClick={onClick}
      className={`group w-full text-left transition-all duration-300 ${className}`}
    >
      <div className={`rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all ${featured ? 'border-2 border-primary-500 bg-white' : 'bg-white border border-cloud-200 hover:border-cloud-300'}`}>
        {/* Thumbnail */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary-100 to-sky-100">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {featured && (
            <div className="absolute top-3 right-3 bg-primary-600 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide">
              Featured
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <Badge variant="primary" size="sm" className="bg-white/20 border-white/30 text-white">
              {difficulty}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Title */}
          <h3 className="text-lg font-bold text-cloud-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {title}
          </h3>

          {/* Description */}
          <p className="text-sm text-cloud-600 mb-4 line-clamp-2">
            {description}
          </p>

          {/* Skills */}
          {skills && skills.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {skills.slice(0, 2).map((skill, idx) => (
                <span key={idx} className="inline-block px-2.5 py-1 rounded-md bg-cloud-100 text-cloud-700 text-xs font-medium">
                  {skill}
                </span>
              ))}
              {skills.length > 2 && (
                <span className="inline-block px-2.5 py-1 text-xs font-medium text-cloud-600">
                  +{skills.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between pt-4 border-t border-cloud-100">
            <div className="flex items-center gap-4 text-xs text-cloud-600">
              {/* Duration */}
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-cloud-500" />
                <span>{duration}</span>
              </div>

              {/* Students */}
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-cloud-500" />
                <span>{students}</span>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-cloud-900">{rating}</span>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary-600 group-hover:text-primary-700 transition-colors">
            Launch Course
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </button>
  );
}
