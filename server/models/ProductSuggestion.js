import mongoose from 'mongoose';

const productSuggestionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxLength: [50, 'Name cannot be more than 50 characters']
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email'
            ]
        },
        country: {
            type: String,
            required: [true, 'Country is required'],
        },
        productDetails: {
            type: String,
            required: [true, 'Product details are required'],
            maxLength: [1000, 'Product details cannot be more than 1000 characters']
        },
        relevantLink: {
            type: String,
            match: [
                /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
                'Please add a valid URL'
            ]
        },
        isSaved: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model('ProductSuggestion', productSuggestionSchema);
